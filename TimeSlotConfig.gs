// 時間帯設定（GAS サーバー側）
// クライアントの timeslot-schedules.js と同等のデータを保持

var TIMESLOT_SCHEDULES = {
	"1": {
		"1": { "A": "10:00-10:55", "B": "11:35-12:30", "C": "13:10-14:05" },
		"2": { "D": "10:00-10:55", "E": "11:35-12:30", "F": "13:10-14:05" }
	},
	"2": {
		"1": { "A": "09:30-10:25", "B": "11:05-12:00", "C": "12:40-13:35" },
		"2": { "D": "09:30-10:25", "E": "11:05-12:00", "F": "12:40-13:35" }
	},
	"3": {
		"1": { "A": "10:15-11:10", "B": "11:50-12:45", "C": "13:25-14:20" },
		"2": { "D": "10:15-11:10", "E": "11:50-12:45", "F": "13:25-14:20" }
	},
	"4": {
		"1": { "A": "09:45-10:40", "B": "11:20-12:15", "C": "12:55-13:50" },
		"2": { "D": "09:45-10:40", "E": "11:20-12:15", "F": "12:55-13:50" }
	},
	"5": {
		"1": { "A": "10:30-11:25", "B": "12:05-13:00", "C": "13:40-14:35" },
		"2": { "D": "10:30-11:25", "E": "12:05-13:00", "F": "13:40-14:35" }
	},
	"6": {
		"1": { "A": "09:15-10:10", "B": "10:50-11:45", "C": "12:25-13:20" },
		"2": { "D": "09:15-10:10", "E": "10:50-11:45", "F": "12:25-13:20" }
	},
	"7": {
		"1": { "A": "10:45-11:40", "B": "12:20-13:15", "C": "13:55-14:50" },
		"2": { "D": "10:45-11:40", "E": "12:20-13:15", "F": "13:55-14:50" }
	},
	"8": {
		"1": { "A": "09:00-09:55", "B": "10:35-11:30", "C": "12:10-13:05" },
		"2": { "D": "09:00-09:55", "E": "10:35-11:30", "F": "12:10-13:05" }
	},
	"見本演劇": {
		"1": { "A": "14:00-14:20", "B": "15:30-15:50" }
	}
};

function TimeSlotConfig_getTimeslotTime(group, day, timeslot) {
	try {
		return TIMESLOT_SCHEDULES[String(group)][String(day)][String(timeslot)];
	} catch (e) {
		return '';
	}
}

function TimeSlotConfig_getTimeslotDisplayName(group, day, timeslot) {
	var time = TimeSlotConfig_getTimeslotTime(group, day, timeslot);
	return String(timeslot) + '時間帯' + (time ? ' (' + time + ')' : '');
}

function TimeSlotConfig_getAllTimeslotsForGroup(group) {
	var groupSchedule = TIMESLOT_SCHEDULES[String(group)];
	if (!groupSchedule) return [];
	var results = [];
	for (var d in groupSchedule) {
		var daySchedule = groupSchedule[d];
		for (var t in daySchedule) {
			var time = daySchedule[t];
			results.push({
				day: String(d),
				timeslot: String(t),
				time: String(time),
				displayName: String(t) + '時間帯 (' + String(time) + ')'
			});
		}
	}
	return results;
}

// 重複定義ブロックを削除（TimeSlotConfig_* API と上部の TIMESLOT_SCHEDULES を正とする）