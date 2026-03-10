const fs = require("fs");

// ============================================================
// Function 1: getShiftDuration(startTime, endTime)
// startTime: (typeof string) formatted as hh:mm:ss am or hh:mm:ss pm
// endTime: (typeof string) formatted as hh:mm:ss am or hh:mm:ss pm
// Returns: string formatted as h:mm:ss
// ============================================================
function getShiftDuration(startTime, endTime) {
    // Parse time string in format "h:mm:ss am/pm" or "hh:mm:ss am/pm"
    function parseTime(timeStr) {
        const parts = timeStr.trim().split(" ");
        const timeParts = parts[0].split(":");
        let hours = parseInt(timeParts[0]);
        const minutes = parseInt(timeParts[1]);
        const seconds = parseInt(timeParts[2]);
        const period = parts[1].toLowerCase();
        
        // Convert to 24-hour format
        if (period === "pm" && hours !== 12) {
            hours += 12;
        } else if (period === "am" && hours === 12) {
            hours = 0;
        }
        
        // Return total seconds
        return hours * 3600 + minutes * 60 + seconds;
    }
    
    const startSeconds = parseTime(startTime);
    const endSeconds = parseTime(endTime);
    
    // Calculate duration in seconds
    let durationSeconds = endSeconds - startSeconds;
    
    // Handle case where end time is on the next day
    if (durationSeconds < 0) {
        durationSeconds += 24 * 3600;
    }
    
    // Convert back to h:mm:ss format
    const hours = Math.floor(durationSeconds / 3600);
    const minutes = Math.floor((durationSeconds % 3600) / 60);
    const seconds = durationSeconds % 60;
    
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

// ============================================================
// Function 2: getIdleTime(startTime, endTime)
// startTime: (typeof string) formatted as hh:mm:ss am or hh:mm:ss pm
// endTime: (typeof string) formatted as hh:mm:ss am or hh:mm:ss pm
// Returns: string formatted as h:mm:ss
// ============================================================
function getIdleTime(startTime, endTime) {
    // Idle time is time outside delivery hours (before 8 AM or after 10 PM)
    // Delivery hours: 8 AM to 10 PM
    
    function parseTime(timeStr) {
        const parts = timeStr.trim().split(" ");
        const timeParts = parts[0].split(":");
        let hours = parseInt(timeParts[0]);
        const minutes = parseInt(timeParts[1]);
        const seconds = parseInt(timeParts[2]);
        const period = parts[1].toLowerCase();
        
        // Convert to 24-hour format
        if (period === "pm" && hours !== 12) {
            hours += 12;
        } else if (period === "am" && hours === 12) {
            hours = 0;
        }
        
        // Return total seconds
        return hours * 3600 + minutes * 60 + seconds;
    }
    
    const startSeconds = parseTime(startTime);
    const endSeconds = parseTime(endTime);
    
    // Delivery hours in seconds: 8 AM to 10 PM
    const deliveryStartSeconds = 8 * 3600; // 8 AM
    const deliveryEndSeconds = 22 * 3600; // 10 PM
    
    let idleSeconds = 0;
    
    // Calculate shift duration
    let shiftStartSecs = startSeconds;
    let shiftEndSecs = endSeconds;
    
    // Handle next-day shift
    if (shiftEndSecs < shiftStartSecs) {
        shiftEndSecs += 24 * 3600;
    }
    
    // Time before 8 AM
    if (shiftStartSecs < deliveryStartSeconds) {
        const beforeDelivery = Math.min(deliveryStartSeconds, shiftEndSecs) - shiftStartSecs;
        idleSeconds += beforeDelivery;
    }
    
    // Time after 10 PM
    if (shiftEndSecs > deliveryEndSeconds) {
        const afterDeliveryStart = Math.max(deliveryEndSeconds, shiftStartSecs);
        idleSeconds += shiftEndSecs - afterDeliveryStart;
    }
    
    // Convert back to h:mm:ss format
    const hours = Math.floor(idleSeconds / 3600);
    const minutes = Math.floor((idleSeconds % 3600) / 60);
    const seconds = idleSeconds % 60;
    
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

// ============================================================
// Function 3: getActiveTime(shiftDuration, idleTime)
// shiftDuration: (typeof string) formatted as h:mm:ss
// idleTime: (typeof string) formatted as h:mm:ss
// Returns: string formatted as h:mm:ss
// ============================================================
function getActiveTime(shiftDuration, idleTime) {
    function parseTime(timeStr) {
        const timeParts = timeStr.split(":");
        const hours = parseInt(timeParts[0]);
        const minutes = parseInt(timeParts[1]);
        const seconds = parseInt(timeParts[2]);

        return hours * 3600 + minutes * 60 + seconds;
    }

    const shiftSeconds = parseTime(shiftDuration);
    const idleSeconds = parseTime(idleTime);
    const activeSeconds = shiftSeconds - idleSeconds;

    const hours = Math.floor(activeSeconds / 3600);
    const minutes = Math.floor((activeSeconds % 3600) / 60);
    const seconds = activeSeconds % 60;

    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

// ============================================================
// Function 4: metQuota(date, activeTime)
// date: (typeof string) formatted as yyyy-mm-dd
// activeTime: (typeof string) formatted as h:mm:ss
// Returns: boolean
// ============================================================
function metQuota(date, activeTime) {
    const dateParts = date.split("-");
    const year = parseInt(dateParts[0]);
    const month = parseInt(dateParts[1]);
    const day = parseInt(dateParts[2]);

    const timeParts = activeTime.split(":");
    const activeSeconds =
        parseInt(timeParts[0]) * 3600 +
        parseInt(timeParts[1]) * 60 +
        parseInt(timeParts[2]);

    const isEidPeriod = year === 2025 && month === 4 && day >= 10 && day <= 30;
    const requiredSeconds = isEidPeriod ? 6 * 3600 : 8 * 3600 + 24 * 60;

    return activeSeconds >= requiredSeconds;
}

// ============================================================
// Function 5: addShiftRecord(textFile, shiftObj)
// textFile: (typeof string) path to shifts text file
// shiftObj: (typeof object) has driverID, driverName, date, startTime, endTime
// Returns: object with 10 properties or empty object {}
// ============================================================
function addShiftRecord(textFile, shiftObj) {
}

// ============================================================
// Function 6: setBonus(textFile, driverID, date, newValue)
// textFile: (typeof string) path to shifts text file
// driverID: (typeof string)
// date: (typeof string) formatted as yyyy-mm-dd
// newValue: (typeof boolean)
// Returns: nothing (void)
// ============================================================
function setBonus(textFile, driverID, date, newValue) {
}

// ============================================================
// Function 7: countBonusPerMonth(textFile, driverID, month)
// textFile: (typeof string) path to shifts text file
// driverID: (typeof string)
// month: (typeof string) formatted as mm or m
// Returns: number (-1 if driverID not found)
// ============================================================
function countBonusPerMonth(textFile, driverID, month) {
}

// ============================================================
// Function 8: getTotalActiveHoursPerMonth(textFile, driverID, month)
// textFile: (typeof string) path to shifts text file
// driverID: (typeof string)
// month: (typeof number)
// Returns: string formatted as hhh:mm:ss
// ============================================================
function getTotalActiveHoursPerMonth(textFile, driverID, month) {
}

// ============================================================
// Function 9: getRequiredHoursPerMonth(textFile, rateFile, bonusCount, driverID, month)
// textFile: (typeof string) path to shifts text file
// rateFile: (typeof string) path to driver rates text file
// bonusCount: (typeof number) total bonuses for given driver per month
// driverID: (typeof string)
// month: (typeof number)
// Returns: string formatted as hhh:mm:ss
// ============================================================
function getRequiredHoursPerMonth(textFile, rateFile, bonusCount, driverID, month) {
}

// ============================================================
// Function 10: getNetPay(driverID, actualHours, requiredHours, rateFile)
// driverID: (typeof string)
// actualHours: (typeof string) formatted as hhh:mm:ss
// requiredHours: (typeof string) formatted as hhh:mm:ss
// rateFile: (typeof string) path to driver rates text file
// Returns: integer (net pay)
// ============================================================
function getNetPay(driverID, actualHours, requiredHours, rateFile) {
}

module.exports = {
    getShiftDuration,
    getIdleTime,
    getActiveTime,
    metQuota,
    addShiftRecord,
    setBonus,
    countBonusPerMonth,
    getTotalActiveHoursPerMonth,
    getRequiredHoursPerMonth,
    getNetPay
};
