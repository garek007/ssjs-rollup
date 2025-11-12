/**
 * Writes a string to the page response and optionally adds one or more line breaks.
 * Primarily used for debugging or outputting text in server-side scripts.
 *
 * @param {string} str - The string to write to the response.
 * @param {number} [linebreaks=1] - The number of line breaks to append (default is 1).
 */
export function Output(str,linebreaks) {
    Platform.Response.Write(str);
    linebreaks = linebreaks || 1;
    for(var line in linebreaks){
        Platform.Response.Write("\r\n");
    }
 }
/**
 * Converts a JavaScript object into a JSON-formatted string.
 * Wrapper for the Marketing Cloud Platform.Function.Stringify() method.
 *
 * @param {object} obj - The object to stringify.
 * @returns {string} JSON representation of the input object.
 */
export function Stringify(obj) {
    return Platform.Function.Stringify(obj);
}
export function writeLogWSProxy(message){

}
/**
 * Checks a Data Extension for a valid (non-expired) authentication token for a given system.
 * If no valid token exists, requests a new one and stores it back into the Data Extension.
 *
 * @param {string} system - The name of the system ("Marketing Cloud", "Beamery", etc.).
 * @param {object} config - The configuration object containing credentials and URLs.
 * @param {string} dataExtension - The external key of the Data Extension that stores tokens.
 * @returns {string} The existing or newly retrieved token.
 */
export function checkForStoredToken(system,config,dataExtension){
    var prox = new Script.Util.WSProxy();   
    var rightNow = new Date();
    var expiry = new Date();

    if(system == "Marketing Cloud"){
        expiry = expiry.setMinutes(expiry.getMinutes()-19);
    }else{
        expiry = expiry.setHours(expiry.getHours()-24);
    }


    var cols = ["token"];
    var leftFilter = {
        Property: "expiration",
        SimpleOperator: "greaterThan",
        Value: expiry
        };

    var rightFilter = {
        Property: "system",
        SimpleOperator: "equals",
        Value: system
        };

    var complexFilter = {
        LeftOperand: leftFilter,
        LogicalOperator:"AND",
        RightOperand: rightFilter
        }

    var data = prox.retrieve("DataExtensionObject["+dataExtension+"]",cols,complexFilter);
    var existingToken = data.Results[0].Properties[0].Value;
    if(existingToken == null){

        switch(system){
            case "Marketing Cloud":var token = authMC(config.mc.subdomain,config.mc.mid,config.mc.clientid,config.mc.clientsecret);break;
            case "Beamery":var token = authBeamery2(config.beamery.baseURL);break;
            default:Output("something went wrong");
        }
        var props = [
        {
            "Name": "token",
            "Value": token
        },
        {
            "Name": "expiration",
            "Value": new Date()
        },
        {
            "Name": "system",
            "Value": system
        }
        ];

         var options = {SaveOptions: [{'PropertyName': '*', SaveAction: 'UpdateAdd'}]};  
         var result = prox.updateItem('DataExtensionObject', {
             CustomerKey: dataExtension,
             Properties: props
         },options); 

        return token; 
    }else{
        return existingToken
    }

}
/**
 * Authenticates with the Marketing Cloud API using client credentials.
 * Sends a POST request to the authentication endpoint and retrieves an access token.
 *
 * @param {string} subdomain - The subdomain for the MC API (e.g., "mc123abc").
 * @param {string} accountid - The MID (account ID) for the target Marketing Cloud account.
 * @param {string} clientid - The client ID for the API integration.
 * @param {string} clientsecret - The client secret for the API integration.
 * @returns {string} The retrieved access token, or undefined if an error occurs.
 */
function authMC(subdomain,accountid,clientid,clientsecret){

    var baseURI = 'https://'+subdomain+'.auth.marketingcloudapis.com/';
    var endpoint = 'v2/token';
    var url = baseURI+endpoint;
    var grant = 'client_credentials';
    var contentType = 'application/json';
    var payload = '{"grant_type":"'+grant+'","client_id":"'+clientid+'","client_secret":"'+clientsecret+'","account_id":"'+accountid+'"}';
    try {

        var request = scriptUtilRequest(url,"POST","Accept", "application/json",payload);
        var resp = Platform.Function.ParseJSON(request.content + "");
     return resp.access_token; 
    
     } catch (e) {
        Output("<br>e: " + Stringify(e));
     }
}
/**
 * Sends an HTTP request using Script.Util.HttpRequest and returns the response.
 * Can be used for GET, POST, or PATCH requests with optional headers and payloads.
 *
 * @param {string} url - The target URL for the request.
 * @param {string} method - The HTTP method (e.g., "GET", "POST", "PATCH").
 * @param {string} headerName - The name of the header to include.
 * @param {string} headerValue - The value of the header to include.
 * @param {string} [postData] - Optional JSON payload for POST/PATCH requests.
 * @param {string} [contentType='application/json'] - The content type for the request.
 * @returns {object} The HTTP response object or an error object on failure.
 */
export function scriptUtilRequest(url,method,headerName,headerValue,postData,contentType){
    var req = new Script.Util.HttpRequest(url);

    req.emptyContentHandling = 0;
    req.retries = 2;
    req.continueOnError = false;
    req.contentType = contentType || 'application/json';
    req.setHeader(headerName,headerValue);
    req.method = method;
    req.encoding = "UTF-8";
    if(postData){
        req.postData = postData;
    }

try{
    var resp = req.send();
    return resp;

    }catch(e){
        //res.errors.push({ErrorMsg:e.message,ErrorDescription:e.description,IP_Address:Platform.Request.ClientIP});
        return e;
        //logFailed({ErrorMsg:message,ErrorDescription:e.description},"not_applicable");
    }
    
}

function getIsoTime(offset,units){

    try{
    var amp = '\%\%[ ';

        if(offset){
            amp += 'set @date = DateAdd(Now(),"'+offset+'","'+units+'") '
        }else{
            amp += 'set @date = Now() '
        }
        
        amp += 'set @d = FormatDate(@date,"iso") '
        amp += 'output(v(@d)) ';
        amp += ']\%\%';
        return Platform.Function.TreatAsContent(amp);
    } catch (e2) {
        //Output(Stringify(e2));//Output('{"message":"User ID is empty.","type":"error"}');
        return Stringify(e2);
    }      
}






