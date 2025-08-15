export function Output(str,linebreaks) {
    Platform.Response.Write(str);
    linebreaks = linebreaks || 1;
    for(var line in linebreaks){
        Platform.Response.Write("\r\n");
    }
 }
export function Stringify(obj) {
    return Platform.Function.Stringify(obj);
}
export function writeLogWSProxy(message){

}
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
        var message = "Failed at Authentication: "+e.message;
        Output(message);
        Output("\r\n");
        Output(e.description);
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






