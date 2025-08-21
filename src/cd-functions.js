/**
 * These functions are more specific to the contact delete script, 
 * so I did not want them included in my main functions.js file. 
 */
export function getDE(deName){
    var api = new Script.Util.WSProxy();
    var filter = {
        Property: "Name",
        SimpleOperator: "equals",
        Value: deName
    };
    return api.retrieve("DataExtension",["Name","IsSendable","CategoryID"],filter);    
}
/**
 * 
 * @param {*} deKey - The CustomerKey of the de you are trying to write to
 * Note that this function won't work if you are calling it from a child
 * business unit to update a DE that is in the Shared Data Extensions folder
 */
export function LogClass(deKey){
    this.api = new Script.Util.WSProxy();
    this.updateObject = {
        CustomerKey: deKey
    };

    /**
     * Starts our log
     */    
    this.initLog = function(sourceDE,categoryID,guid){

        this.updateObject.Properties = [
            {
                Name: 'source_de',
                Value: sourceDE
            },           
            {
                Name: 'source_de_folder_id',
                Value: categoryID
            },
            {
                Name: 'start_time',
                Value: Platform.Function.Now()
            },
            {
                Name: 'run_id',
                Value: guid
            }             
        ];
   
        var options = {SaveOptions: [{'PropertyName': '*', SaveAction: 'UpdateAdd'}]};
        return this.api.updateItem('DataExtensionObject', this.updateObject, options); 
    }
    this.error = function(message,guid){
        this.updateObject.Properties = [
            {
                Name: 'error_message',
                Value: message
            },           
            {
                Name: 'run_id',
                Value: guid
            }            
        ];
   
        var options = {SaveOptions: [{'PropertyName': '*', SaveAction: 'UpdateAdd'}]};
        return this.api.updateItem('DataExtensionObject', this.updateObject, options); 
    }
}



