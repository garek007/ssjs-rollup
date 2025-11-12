# SSJS with RollupJS
A more modern way to work with SSJS and keep it organized.

NOTE: Rather than create several projects, I've opted to do everything in this project and modify rollup.config.js line 2, the input location to reference my working file. Otherwise, doing SSJS this way defeats the purpose of having all my functions in one, tidy place. 

[Bulk API Limits](https://developer.salesforce.com/docs/atlas.en-us.salesforce_app_limits_cheatsheet.meta/salesforce_app_limits_cheatsheet/salesforce_app_limits_platform_bulkapi.htm)

### Validate your SSJS
https://developer.salesforce.com/docs/marketing/marketing-cloud/guide/ssjs_error_handling.html
https://developer.salesforce.com/docs/marketing/marketing-cloud/guide/ssjs_platformUtilityRaiseError.html

### Fixes
Need to add something to strip comments, maybe rollup-plugin-cleanup (google it)