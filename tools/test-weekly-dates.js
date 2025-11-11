const parseDateToUTC = (dateString) => {
    const parts = dateString.split('-').map(Number)
    return new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]))
}

const formatDateIST = (date) => {
    const istOffsetMs = 5.5 * 60 * 60 * 1000
    const ist = new Date(date.getTime() + istOffsetMs)
    return `${ist.getUTCFullYear()}-${String(ist.getUTCMonth() + 1).padStart(2, '0')}-${String(ist.getUTCDate()).padStart(2, '0')}`
}

function generateWeeklyDates(start_date, dayOfWeek, end_date) {
    const startDate = parseDateToUTC(start_date)
    const endDate = end_date ? parseDateToUTC(end_date) : parseDateToUTC(`${new Date().getFullYear()}-12-31`)

    if (startDate >= endDate) {
        throw new Error('End date must be after start date')
    }

    const currentDate = new Date(startDate)
    // find first occurrence (UTC-safe)
    while (currentDate.getUTCDay() !== dayOfWeek && currentDate <= endDate) {
        currentDate.setUTCDate(currentDate.getUTCDate() + 1)
    }

    if (currentDate > endDate) return []

    const results = []
    while (currentDate <= endDate) {
        results.push(formatDateIST(currentDate))
        currentDate.setUTCDate(currentDate.getUTCDate() + 7)
    }

    return results
}

// Test cases
const tests = [
    { start: '2025-08-01', day: 5, label: 'Friday test (dayOfWeek=5)' },
    { start: '2025-08-01', day: 0, label: 'Sunday test (dayOfWeek=0)' },
    { start: '2025-08-28', day: 5, label: 'Start equals a Thursday, next Friday expected' }
]

for (const t of tests) {
    try {
        const dates = generateWeeklyDates(t.start, t.day, null)
        console.log(`\n${t.label} — first 5 dates from start ${t.start}:`)
        console.log(dates.slice(0, 5).join(', '))
    } catch (err) {
        console.error(`Error for ${t.label}:`, err.message)
    }
}

// Also print a mapping of the first result's weekday in IST (for clarity)
const weekdayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
for (const t of tests) {
    const dates = generateWeeklyDates(t.start, t.day, null)
    if (dates.length > 0) {
        const d = dates[0].split('-').map(Number)
        // Construct IST date for weekday calc: parse as UTC midnight then add IST offset
        const utcDate = new Date(Date.UTC(d[0], d[1] - 1, d[2]))
        const ist = new Date(utcDate.getTime() + 5.5 * 60 * 60 * 1000)
        console.log(`\n${t.label} => first date ${dates[0]} which is ${weekdayNames[ist.getUTCDay()]}`)
    }
}
