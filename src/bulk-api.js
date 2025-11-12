import { Stringify, Output, scriptUtilRequest } from "./ref/functions";
/** Salesforce Bulk API Functions */

/**
 * 
 * @param {*} host - Url of the specific Salesforce account
 * @param {*} token - Authorization token
 * @param {*} obj - Object to use for opening bulk job i.e. Contact, Lead, Account, etc
 * @param {*} op - Operation i.e. Create, Update, Delete
 * @param {*} apiv - API Version of this Salesforce account
 * @returns 
 */

export function openBulkReq(host, token, obj, op, apiv) {
  
    var route = '/services/data/v'+apiv+'/jobs/ingest/';
    var url = host + route;
    var payload = {
      object: obj,
      contentType: 'CSV',
      operation: op,
      lineEnding: 'CRLF'
    };
    
    var request = scriptUtilRequest(url,"POST","Authorization", "Bearer "+token,Stringify(payload));
    return Platform.Function.ParseJSON(request.content + "");

}


function processBatch(instance, token, jobId, id, cols, vals) {

    var moreData = true;                
    var reqID = null;                                                                
  
    var csvData = id + ',' + cols.toString() + '\r\n'; 
        csvData += data.join(',' + vals.toString() + '\r\n');
    
    var updateJob = updateBulkReq(instance, token, jobId, csvData);  
    return updateJob;
}

function updateBulkReq(host, token, jobId, csvData) {

    var route = '/services/data/v49.0/jobs/ingest/' + jobId + '/batches';
    var url = host + route;
    var req = new Script.Util.HttpRequest(url);
    req.emptyContentHandling = 0;
    req.retries = 2;
    req.continueOnError = true;
    req.contentType = 'text/csv';
    req.method = 'PUT';
    req.setHeader('Authorization', 'Bearer ' + token);
    req.postData = csvData;
  
    var res = req.send();
    var resObj = Platform.Function.ParseJSON(String(resp.content));
  
    return resObj;
}

export function getBulkJobInfo(host, token, jobId, apiv) {
    var route = '/services/data/v'+apiv+'/jobs/ingest/' + jobId;
    var url = host + route;    
    var request = scriptUtilRequest(url,"GET","Authorization", "Bearer "+token);
    return Platform.Function.ParseJSON(request.content + "");    
}
function closeBulkReq(host, token, jobId, apiv) {

    var url = host + '/services/data/v'+apiv+'/jobs/ingest/' + jobId;
    var payload = {}
    payload.state = 'UploadComplete';
    
    var req = new Script.Util.HttpRequest(url);
    req.emptyContentHandling = 0;
    req.retries = 2;
    req.continueOnError = true;
    req.contentType = 'application/json';
    req.method = 'PATCH';
    req.setHeader('Authorization', 'Bearer ' + token);
    req.postData = Stringify(payload);
  
    var res = req.send();
    var resObj = Platform.Function.ParseJSON(String(res.content));
  
    return resObj;
  } 