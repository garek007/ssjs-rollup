import { Stringify, Output } from "./functions";

export function authSF(host,clientid,clientsecret){

    var endpoint = 'services/oauth2/token';
    var url = host+endpoint;

    var payload = 'grant_type=client_credentials';
        payload += '&client_id='+clientid;
        payload += '&client_secret='+clientsecret;

    var req = new Script.Util.HttpRequest(url);

        req.emptyContentHandling = 0;
        req.retries = 2;
        req.continueOnError = false;
        req.contentType = "application/x-www-form-urlencoded";
        req.setHeader("Cache-Control","no-cache");
        req.setHeader("Accept","*/*");
        req.setHeader("Accept-Encoding","gzip");    
        req.method = 'POST';
        req.encoding = "UTF-8";
        req.postData = payload;


try{
    var request = req.send();
    var resp = Platform.Function.ParseJSON(request.content + "");
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

function oAuth(host, clientId, clientSecret, username, password, token) {

    var route = '/services/oauth2/token';
    var url = host + route;
    var contentType = 'application/x-www-form-urlencoded';
  
    var payload = 'grant_type=password';
    payload += '&client_id=' + clientId;
    payload += '&client_secret=' + clientSecret;
    payload += '&username=' + username;
    payload += '&password=' + password + token;
    
    var req = HTTP.Post(url, contentType, payload);
    var res = Platform.Function.ParseJSON(req['Response'][0]);
    
    return res;
  }