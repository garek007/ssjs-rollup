import { Stringify, Output, scriptUtilRequest } from "./functions";

function getDERowsSOAP(key, filter) {
    /**
     * FILTER EXAMPLE
     *   var pk = 'AccountID'; // field name for Salesforce record Id to process
     *   var processedField = 'Processed'; // Boolean field to update after processing records
      var filter = { Property: processedField,
                    SimpleOperator: 'notEquals', 
                    Value: true
                    }  
     */
      
        var prox = new Script.Util.WSProxy();
            prox.setClientId({
              "ID":Platform.Function.AuthenticatedMemberID(),
              "UserID":Platform.Function.AuthenticatedEmployeeID()
            });
      var options                         = {IncludeObjects: true};
        var moreData = true,
            reqID = data = null;
      var arr = [];
        while (moreData) {
      
          moreData = false;
      
          if (reqID == null) {
        
            var queryAllAccounts = true;
            //data = prox.retrieve('DataExtensionObject[' + key + ']', [pk], filter,options,queryAllAccounts);//this only works from parent
            data = prox.retrieve('DataExtensionObject[' + key + ']', [pk], filter);
       
            //Output(Stringify(data));
      
            if(data.Status.indexOf('Error') !== -1){
              Output(data.Status);
              Output("\r\n");
              Output('If you are running this on a shared DE, it will only work from the parent');
            }
            
          } else {
            data = prox.getNextBatch('DataExtensionObject[' + key + ']', reqID);
    
          }
      
          if (data.length > 0) {
            
            
            moreData = data.HasMoreRows;
            
            reqID = data.RequestID;
    
            for (var i = 0; i < data.Results.length; i++) {
              var res = data.Results[i].Properties;
              for (k in res) {
                if (res[k].Name == pk) { // ignore internal fields
                  var id = res[k].Value;
                }
              }
              arr.push(id);
            }
          
          }
        }
        return arr;
}



function upsertDERowsAsync(subdomain,mid,token,payload,deName){

    var baseURI = 'https://'+subdomain+'.rest.marketingcloudapis.com/';
    var endpoint = 'data/v1/async/dataextensions/key:'+deName+'/rows';
    var url = baseURI+endpoint;
    var contentType = 'application/json';
    var headerNames = ["Authorization"];
    var headerValues = ["Bearer "+token];    

    try {

        var req = new Script.Util.HttpRequest(url);

        req.emptyContentHandling = 0;
        req.retries = 2;
        req.continueOnError = false;
        req.contentType = "application/json"
        req.setHeader("Authorization", 'Bearer ' + token);
        req.method = "PUT";
        req.encoding = "UTF-8";
        req.postData = payload;
        //var p = '{ "items": [{"Email": "umezawa244@gmail.com","FirstName": "毅","LastName": "梅澤","beamery_id": "ec1f7002-33a0-4e59-9bd6-6e7389f7ffeb"}]}';

        var resp = req.send();      // return value will be "typeof clr"; Script.Util.HttpResponse
    
        Output(resp.content)


        } catch (e) {
        Output("<br>e: " + Stringify(e));
        }
}



/**
 fieldObj function makes it easier to set up fields for data extension creation
 fieldObj(fieldName,fieldType,ordinal,isPrimaryKey,isNullable);
*/
function fieldObj(n,t,len,o,pk,nullable){
    var obj = {}
        obj.name = n;
        obj.type = t;
        obj["Length"] = len;
        obj.ordinal = o;
        obj.IsPrimaryKey = pk;
        obj.isNullable = nullable;
        obj.isTemplateField = false;
        obj.isInheritable = true;
        obj.isOverridable = true;
        obj.isHidden = false;
        obj.isReadOnly = false;
        obj.mustOverride = false;

    return obj;    
} 

function makeFieldArray(props,arrItem){
    var array = [];
    for(var prop in props){
        var obj = {};
        obj.Name = props[prop]
        obj.Value = arrItem[props[prop]];

        array.push(obj);
    }

    return array;

}


export function getDERowsREST(key,url,token){
    var page = 1;
    var pageSize = 2500;
    var output = [];
    var endpoint = 'data/v1/customobjectdata/key/'+key+'/rowset?$page='+page+'&$pageSize='+pageSize;


    var request = scriptUtilRequest(url + endpoint,"GET","Authorization", "Bearer "+token);
    var resp = Platform.Function.ParseJSON(request.content + "");

    if(resp.count == 0) return [];

    output = resp.items;
    
    if(resp.count > pageSize){
        
        var loops = resp.count / pageSize;     

        for(var i = 1; i < loops; i++){
            var nextPage = i + 1;

            //var nextURL = restUrl+'contacts/v1/contacts/deleteOperations?$page='+nextPage+'&$pageSize='+pageSize;
            var nextURL = url+'data/v1/customobjectdata/key/'+key+'/rowset?$page='+nextPage+'&$pageSize='+pageSize;
            var request = scriptUtilRequest(nextURL,"GET","Authorization", "Bearer "+token);
            var resp = Platform.Function.ParseJSON(request.content + "");            
            var items = resp.items;

            for(var k in items){
                var item = items[k];
                output.push(item);
            }
        }

   
    }

    return output;
    //return resp;
}
