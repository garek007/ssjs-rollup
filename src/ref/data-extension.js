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

/**
 * Retrieves rows from a Marketing Cloud Data Extension using WSProxy.
 * Handles pagination automatically and returns the results in two formats.
 *
 * RAW FORMAT
 * ----------
 * Each row is returned as an array of Name/Value objects, matching the
 * native WSProxy structure.
 *
 * Example:
 * [
 *   {"Name":"CustomerIdentifier","Value":"21126340"},
 *   {"Name":"Address1","Value":"62 MASTIC BLVD W"}
 * ]
 *
 * This format is useful when reinserting rows into a Data Extension without
 * needing to transform the structure.
 *
 * CLEAN FORMAT
 * ------------
 * Each row is converted into a standard JavaScript object where the column
 * names become properties.
 *
 * Example:
 * {
 *   "CustomerIdentifier": "21126340",
 *   "Address1": "62 MASTIC BLVD W"
 * }
 *
 * Access example:
 * theData.clean[0].Address1
 *
 * @param {Array} cols
 * Array of column names to retrieve from the Data Extension.
 *
 * @param {String} deName
 * Name of the Data Extension.
 *
 * @param {Object} [filter]
 * Optional WSProxy filter object.
 *
 * @returns {Object}
 * Returns an object containing:
 *   raw   - Array of WSProxy-style Name/Value rows
 *   clean - Array of simplified JavaScript objects
 */
function wsProxyRetrieve(cols,deName,filter){

  var prox = new Script.Util.WSProxy(),
      raw = [],
      clean = [],
      moreData = true
      reqID = null;

  while(moreData){
      moreData = false;
      var data = reqID == null
      ? prox.retrieve('DataExtensionObject['+deName+']',cols,typeof filter !== undefined && filter) 
      : prox.getNextBatch('DataExtensionObject['+deName+']',reqID);

      if(data){
          moreData = data.HasMoreRows;
          reqID = data.RequestID;

          if(data.Results){

              for(var k in data.Results) {
                  var props = data.Results[k].Properties;
                  raw.push(props);

                  var tObj = {};

                  for(var i in props){
                      tObj[props[i].Name] = props[i].Value;
                  }
                  clean.push(tObj);
              } 
          }
      }
  }
  return {
      "raw":raw,
      "clean":clean
  };

}


function wsProxyBatchRow(deKey,propsObj){

  var obj = {};
      obj.CustomerKey = deKey;
  
  var propsArray = [];

  for(var key in propsObj){
      if(propsObj.hasOwnProperty(key)){
          var pObj = {};
              pObj.Name = key;
              pObj.Value = propsObj[key];
              propsArray.push(pObj);
      }
  }

  obj.Properties = propsArray;
  return obj;


}