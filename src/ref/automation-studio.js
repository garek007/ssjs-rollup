import { Stringify, Output, scriptUtilRequest } from "./functions";

/**
 * 
 * @param {number} startDay - day data extract will start
 * @param {number} endDay - day data extract will end
 * @param {number} year - current year, used to build datetime string
 * @param {number} month - current month, used to build datetime string
 * @param {string} subdomain - MC subdomain for post url
 * @param {string} token - MC token
 */
export function dataExtractSOAP(startDay, endDay, year, month, subdomain, token) {

    var url = 'https://'+subdomain+'.soap.marketingcloudapis.com/Service.asmx';
    var startDateTime = month+'/'+startDay+'/'+year+' 12:00:00 AM';
    var endDateTime = month+'/'+endDay+'/'+year+' 11:59:59 PM';
    var soapAction = 'Extract';
    var soapEnv = '<s:Envelope xmlns:s="http://www.w3.org/2003/05/soap-envelope" xmlns:a="http://schemas.xmlsoap.org/ws/2004/08/addressing" xmlns:u="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd">';
        soapEnv+= '<s:Header><a:Action s:mustUnderstand="1">'+soapAction+'</a:Action><a:To s:mustUnderstand="1">'+url+'</a:To>';
        soapEnv+= '<fueloauth>'+token+'</fueloauth></s:Header><s:Body xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema">';
        soapEnv+= '<ExtractRequestMsg xmlns="http://exacttarget.com/wsdl/partnerAPI"><Requests><ID>c7219016-a7f0-4c72-8657-1ec12c28a0db</ID><Parameters>';
        soapEnv+= parameter("OutputFileName",'testdates333.zip');
        soapEnv+= parameter("StartDate",startDateTime);
        soapEnv+= parameter("EndDate",endDateTime);
        soapEnv+= parameter("Format","csv");
        //soapEnv+= parameter("QuoteText","false");
        soapEnv+= parameter("ColumnDelimiter",",");
        //soapEnv+= parameter("UnicodeOutput","false");
        soapEnv+= parameter("NotificationEmail","stan.alachniewicz@labcorp.com");
        //soapEnv+= parameter("Timezone","79");
        //soapEnv+= parameter("UseLocalTZinQuerypublic","false");
        //soapEnv+= parameter("IncludeMilliseconds","false");
        //soapEnv+= parameter("ExtractSubscribers","false");
        //soapEnv+= parameter("IncludeAllSubscribers","false");
        //soapEnv+= parameter("ExtractAttributes","false");
        //soapEnv+= parameter("extractStatusChanges","false");
        //soapEnv+= parameter("IncludeGEO","false");
        //soapEnv+= parameter("IncludeUserAgentInformation","false");
        
        //soapEnv+= parameter("ExtractSent","true");
        //soapEnv+= parameter("ExtractNotSent","true");
        //soapEnv+= parameter("ExtractSendData","true");
        //soapEnv+= parameter("ExtractSendImpressions","true");
        //soapEnv+= parameter("IncludeTestSends","true");
        soapEnv+= parameter("ExtractSendJobs","true");
        //soapEnv+= parameter("ExtractOpens","true");
        //soapEnv+= parameter("IncludeUniqueOpens","true");
        //soapEnv+= parameter("IncludeInferredOpens","true");
        soapEnv+= parameter("ExtractClicks","true");
        //soapEnv+= parameter("ExtractClickImpressions","true");
        //soapEnv+= parameter("IncludeUniqueClicks","true");
        //soapEnv+= parameter("IncludeUniqueForURLClicks","true");
        soapEnv+= parameter("ExtractBounces","true");
        soapEnv+= parameter("ExtractUnsubs","true");
        soapEnv+= parameter("IncludeUnsubReason","true");

        //soapEnv+= parameter("ExtractSpamComplaints","true");
        //soapEnv+= parameter("extractListMembershipChanges","true");
        //soapEnv+= parameter("extractLists","true");
        //soapEnv+= parameter("IncludeAllListMembers","true");
        //soapEnv+= parameter("ExtractMultipleDataExtensionListData","true");
        //soapEnv+= parameter("ExtractConversions","true");
        //soapEnv+= parameter("ExtractSurveyResponses","true");
        //soapEnv+= parameter("IncludeCampaignID","true");
        soapEnv+= parameter("CharacterEncoding","UTF-8");
        soapEnv+='</Parameters>';
        soapEnv+='</Requests>';
        soapEnv+='</ExtractRequestMsg>';
        soapEnv+='</s:Body>';
        soapEnv+='</s:Envelope>';


        var request = scriptUtilRequest(url,"POST","Authorization", "Bearer "+token, soapEnv, 'application/soap+xml; charset=UTF-8');   
        var resp = Platform.Function.ParseJSON(request.content + "");
        Output(Stringify(resp));


  //return soapEnv;


}  
/**
 * Helper function for dataExtractSOAP so you don't need to type out all the XML
 * @param {string} name - parameter name, IE ExtractSent
 * @param {string} value - parameter value, IE "true"
 * @returns 
 */
function parameter(name,value){
    return '<Parameter><Name>'+name+'</Name><Value>'+value+'</Value></Parameter>'
}

/**
 * 
 * @param {string} token - MC token
 * @param {string} id - id of data extract
 * @param {string} url - MC rest URL
 * @param {string} filename - Output filename
 * @returns {object|string} Parsed JSON response on success or an error message on failure.
 */
export function dataExtractUpdate(startDateTime, endDateTime, token, id, url, filename) {

    var endpoint = 'automation/v1/dataextracts/'+id;

    var updateObject = {};
        updateObject.dataExtractTypeId = 'c7219016-a7f0-4c72-8657-1ec12c28a0db';
        updateObject.fileSpec = filename;
        updateObject.startDate = startDateTime;
        updateObject.endDate = endDateTime;     
    var request = scriptUtilRequest(url + endpoint,"PATCH","Authorization", "Bearer "+token, Stringify(updateObject));   
    
    var resp = Platform.Function.ParseJSON(request.content + "");
    
    if(resp.dataExtractDefinitionId){
        return resp;
    }else{
        return request.description;
    }

}  
/**
 * Updates a Marketing Cloud File Transfer activity with a new file name and location.
 * Uses the REST API to modify an existing file transfer definition.
 *
 * @param {string} url - The base REST URL for the MC API.
 * @param {string} token - The Marketing Cloud authentication token.
 * @param {object} obj - The object containing required update properties.
 * @param {string} obj.id - The ID of the File Transfer definition.
 * @param {string} obj.filename - The name of the file to be transferred.
 * @param {string} obj.fileTransferLocationId - The ID of the file transfer location.
 * @returns {object|string} Parsed JSON response on success or an error message on failure.
 */
export function fileTransferUpdate(url, token, obj) {
    
    var endpoint = 'automation/v1/fileTransfers/'+obj.id;

    var updateObject = {};
        updateObject.id = obj.id;
        updateObject.fileSpec = obj.filename;
        updateObject.fileTransferLocationId = obj.fileTransferLocationId;

    var request = scriptUtilRequest(url + endpoint,"PATCH","Authorization", "Bearer "+token, Stringify(updateObject));   
    
    var resp = Platform.Function.ParseJSON(request.content + "");

    if(resp.id){
        return resp;
    }else{
        return request.description;
    }

} 