/**
 * Returns the full month name for a given 1-based month number.
 *
 * @param {number} monthNum - The numeric month (1 = January, 12 = December).
 * @returns {string} The corresponding month name.
 */
export function monthName(monthNum){
    monthNum -= 1; //need to subtract one to account for 0 indexed array
    var monthNames = ['January', 'February', 'March', 'April', 'May', 'June','July', 'August', 'September', 'October', 'November', 'December'];
    return monthNames[monthNum];
}
export function formatDateMMDDYYYY(d) {
    var mm = d.getMonth() + 1;
    var dd = d.getDate();
    var yyyy = d.getFullYear();
    return (mm < 10 ? "0" : "") + mm + "/" + (dd < 10 ? "0" : "") + dd + "/" + yyyy;
  }  