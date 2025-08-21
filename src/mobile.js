/**
 * Needs to be put into function, but good example of queueMO call
 */
var post = Platform.Request.GetPostData();
var postObj = Platform.Function.ParseJSON(post);

var token = checkForStoredToken("Marketing Cloud");


var url = "https://"+config.mc.subdomain+".rest.marketingcloudapis.com/sms/v1/queueMO"; 


var payload = {};
    payload.mobileNumbers = [postObj.phone];
    payload.shortCode = "123456";
    payload.messageText = "KEYWORD";

var update = scriptUtilRequest(url,"POST","Authorization","Bearer "+token,Stringify(payload));


Write(update.content);
