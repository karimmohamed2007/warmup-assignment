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
    const fileContent = fs.readFileSync(textFile, { encoding: "utf8", flag: "r" }).trimEnd();
    const lines = fileContent.length > 0 ? fileContent.split(/\r?\n/) : [];
    const header = lines.length > 0
        ? lines[0]
        : "DriverID,DriverName,Date,StartTime,EndTime,ShiftDuration,IdleTime,ActiveTime,MetQuota,HasBonus";
    const recordLines = lines.slice(1);

    for (let i = 0; i < recordLines.length; i++) {
        const fields = recordLines[i].split(",");
        if (fields[0] === shiftObj.driverID && fields[2] === shiftObj.date) {
            return {};
        }
    }

    const newRecord = {
        driverID: shiftObj.driverID,
        driverName: shiftObj.driverName,
        date: shiftObj.date,
        startTime: shiftObj.startTime,
        endTime: shiftObj.endTime,
        shiftDuration: getShiftDuration(shiftObj.startTime, shiftObj.endTime),
        idleTime: getIdleTime(shiftObj.startTime, shiftObj.endTime),
        activeTime: "",
        metQuota: false,
        hasBonus: false
    };

    newRecord.activeTime = getActiveTime(newRecord.shiftDuration, newRecord.idleTime);
    newRecord.metQuota = metQuota(newRecord.date, newRecord.activeTime);

    const allRecords = recordLines.map((line) => {
        const fields = line.split(",");

        return {
            driverID: fields[0],
            driverName: fields[1],
            date: fields[2],
            startTime: fields[3],
            endTime: fields[4],
            shiftDuration: fields[5],
            idleTime: fields[6],
            activeTime: fields[7],
            metQuota: fields[8] === "true",
            hasBonus: fields[9] === "true"
        };
    });

    allRecords.push(newRecord);
    allRecords.sort((firstRecord, secondRecord) => {
        if (firstRecord.driverID !== secondRecord.driverID) {
            return firstRecord.driverID.localeCompare(secondRecord.driverID);
        }

        return firstRecord.date.localeCompare(secondRecord.date);
    });

    const updatedLines = [header];
    for (let i = 0; i < allRecords.length; i++) {
        const record = allRecords[i];
        updatedLines.push(
            [
                record.driverID,
                record.driverName,
                record.date,
                record.startTime,
                record.endTime,
                record.shiftDuration,
                record.idleTime,
                record.activeTime,
                String(record.metQuota),
                String(record.hasBonus)
            ].join(",")
        );
    }

    fs.writeFileSync(textFile, updatedLines.join("\n"), { encoding: "utf8" });

    return newRecord;
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
    const fileContent = fs.readFileSync(textFile, { encoding: "utf8", flag: "r" }).trimEnd();
    if (fileContent.length === 0) {
        return;
    }

    const lines = fileContent.split(/\r?\n/);

    for (let i = 1; i < lines.length; i++) {
        const fields = lines[i].split(",");
        if (fields[0] === driverID && fields[2] === date) {
            fields[9] = String(newValue);
            lines[i] = fields.join(",");
            break;
        }
    }

    fs.writeFileSync(textFile, lines.join("\n"), { encoding: "utf8" });
}

// ============================================================
// Function 7: countBonusPerMonth(textFile, driverID, month)
// textFile: (typeof string) path to shifts text file
// driverID: (typeof string)
// month: (typeof string) formatted as mm or m
// Returns: number (-1 if driverID not found)
// ============================================================
function countBonusPerMonth(textFile, driverID, month) {
    const normalizedMonth = String(parseInt(month)).padStart(2, "0");
    const fileContent = fs.readFileSync(textFile, { encoding: "utf8", flag: "r" }).trim();

    if (fileContent.length === 0) {
        return -1;
    }

    const lines = fileContent.split(/\r?\n/);
    let driverFound = false;
    let bonusCount = 0;

    for (let i = 1; i < lines.length; i++) {
        const fields = lines[i].split(",");
        if (fields[0] !== driverID) {
            continue;
        }

        driverFound = true;

        const recordMonth = fields[2].split("-")[1];
        const hasBonus = fields[9] === "true";

        if (recordMonth === normalizedMonth && hasBonus) {
            bonusCount++;
        }
    }

    return driverFound ? bonusCount : -1;
}

// ============================================================
// Function 8: getTotalActiveHoursPerMonth(textFile, driverID, month)
// textFile: (typeof string) path to shifts text file
// driverID: (typeof string)
// month: (typeof number)
// Returns: string formatted as hhh:mm:ss
// ============================================================
function getTotalActiveHoursPerMonth(textFile, driverID, month) {
    const normalizedMonth = String(parseInt(month)).padStart(2, "0");
    const fileContent = fs.readFileSync(textFile, { encoding: "utf8", flag: "r" }).trim();

    if (fileContent.length === 0) {
        return "0:00:00";
    }

    const lines = fileContent.split(/\r?\n/);
    let totalSeconds = 0;

    for (let i = 1; i < lines.length; i++) {
        const fields = lines[i].split(",");
        if (fields[0] !== driverID) {
            continue;
        }

        const recordMonth = fields[2].split("-")[1];
        if (recordMonth !== normalizedMonth) {
            continue;
        }

        const activeTimeParts = fields[7].split(":");
        totalSeconds +=
            parseInt(activeTimeParts[0]) * 3600 +
            parseInt(activeTimeParts[1]) * 60 +
            parseInt(activeTimeParts[2]);
    }

    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
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
    const normalizedMonth = String(parseInt(month)).padStart(2, "0");
    const rateContent = fs.readFileSync(rateFile, { encoding: "utf8", flag: "r" }).trim();
    const rateLines = rateContent.length > 0 ? rateContent.split(/\r?\n/) : [];
    let dayOff = "";

    for (let i = 0; i < rateLines.length; i++) {
        const fields = rateLines[i].split(",");
        if (fields[0] === driverID) {
            dayOff = fields[1];
            break;
        }
    }

    const fileContent = fs.readFileSync(textFile, { encoding: "utf8", flag: "r" }).trim();
    if (fileContent.length === 0) {
        return "0:00:00";
    }

    const lines = fileContent.split(/\r?\n/);
    const weekDays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    let requiredSeconds = 0;

    for (let i = 1; i < lines.length; i++) {
        const fields = lines[i].split(",");
        if (fields[0] !== driverID) {
            continue;
        }

        const dateParts = fields[2].split("-");
        const year = parseInt(dateParts[0]);
        const recordMonth = dateParts[1];
        const day = parseInt(dateParts[2]);

        if (recordMonth !== normalizedMonth) {
            continue;
        }

        const recordDate = new Date(year, parseInt(recordMonth) - 1, day);
        const dayName = weekDays[recordDate.getDay()];
        if (dayName === dayOff) {
            continue;
        }

        const isEidPeriod = year === 2025 && parseInt(recordMonth) === 4 && day >= 10 && day <= 30;
        requiredSeconds += isEidPeriod ? 6 * 3600 : 8 * 3600 + 24 * 60;
    }

    requiredSeconds -= bonusCount * 2 * 3600;
    if (requiredSeconds < 0) {
        requiredSeconds = 0;
    }

    const hours = Math.floor(requiredSeconds / 3600);
    const minutes = Math.floor((requiredSeconds % 3600) / 60);
    const seconds = requiredSeconds % 60;

    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
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
    function parseTime(timeStr) {
        const timeParts = timeStr.split(":");
        return (
            parseInt(timeParts[0]) * 3600 +
            parseInt(timeParts[1]) * 60 +
            parseInt(timeParts[2])
        );
    }

    const rateContent = fs.readFileSync(rateFile, { encoding: "utf8", flag: "r" }).trim();
    const rateLines = rateContent.length > 0 ? rateContent.split(/\r?\n/) : [];
    let basePay = 0;
    let tier = 0;

    for (let i = 0; i < rateLines.length; i++) {
        const fields = rateLines[i].split(",");
        if (fields[0] === driverID) {
            basePay = parseInt(fields[2]);
            tier = parseInt(fields[3]);
            break;
        }
    }

    const allowedMissingHoursByTier = {
        1: 50,
        2: 20,
        3: 10,
        4: 3
    };

    const actualSeconds = parseTime(actualHours);
    const requiredSeconds = parseTime(requiredHours);
    const missingSeconds = Math.max(requiredSeconds - actualSeconds, 0);
    const allowedMissingSeconds = (allowedMissingHoursByTier[tier] || 0) * 3600;

    if (missingSeconds <= allowedMissingSeconds) {
        return basePay;
    }

    const deductibleHours = Math.floor((missingSeconds - allowedMissingSeconds) / 3600);
    const deductionRatePerHour = Math.floor(basePay / 185);
    const salaryDeduction = deductibleHours * deductionRatePerHour;

    return basePay - salaryDeduction;
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
