// seats-main.js
import GasAPI from './api.js';

const urlParams = new URLSearchParams(window.location.search);
const group = urlParams.get('group');
const day = urlParams.get('day');
const timeslot = urlParams.get('timeslot');

const state = {
  selectedSeats: [],
  seatStatusMap: {},
  seatRows: ["A","B","C","D","E"]
};

init();

async function init() {
  try {
    setHeader();
    showLoading('座席情報を読み込み中...');
    const data = await GasAPI.getSeatData(group, day, timeslot, false);
    if (!data || !data.seats || !data.meta) throw new Error('座席データが取得できません');
    document.getElementById('timeslot-label').textContent = data.meta.displayName || '';
    buildSeatMap(data.seats);
  } catch (e) {
    showError('座席情報の取得に失敗しました。ページを再読み込みしてください。');
  }
}

function setHeader() {
  const titleEl = document.getElementById('title');
  if (titleEl) {
    const groupLabel = isNaN(parseInt(group)) ? group : group + '組';
    titleEl.textContent = groupLabel + ' 座席選択';
  }
}

function showLoading(text) {
  const container = document.getElementById('seats-container');
  if (container) container.innerHTML = `<div class="loading">${text}</div>`;
}

function showError(text) {
  const container = document.getElementById('error-container');
  const msg = document.getElementById('error-message');
  if (container && msg) {
    msg.textContent = text;
    container.style.display = 'flex';
  } else {
    alert(text);
  }
}

function buildSeatMap(seats) {
  state.seatStatusMap = {};
  seats.forEach(seat => {
    state.seatStatusMap[seat.row + '-' + seat.col] = seat.status;
  });
  const table = document.getElementById('seatTable');
  let html = '';
  for (let i = 0; i < state.seatRows.length; i++) {
    const row = state.seatRows[i];
    html += '<tr>';
    if (i < 4) {
      for (let c = 1; c <= 13; c++) {
        if (c === 7) {
          html += `<td class="aisle"></td>`;
        } else {
          const realCol = c <= 6 ? c : c - 1;
          const key = row + '-' + realCol;
          const status = state.seatStatusMap[key] || '空';
          let classes = 'seat';
          if (status === '確保' || status === 'unavailable') classes += ' disabled';
          if (state.selectedSeats.includes(key)) classes += ' selected';
          html += `<td class="${classes}" data-seat="${key}">${row}${realCol}</td>`;
        }
      }
    } else {
      html += `<td class="aisle"></td>
        <td class="aisle"></td>
        <td class="aisle"></td>`;
      for (let c = 1; c <= 3; c++) {
        const key = row + '-' + c;
        const status = state.seatStatusMap[key] || '空';
        let classes = 'seat';
        if (status === '確保' || status === 'unavailable') classes += ' disabled';
        if (state.selectedSeats.includes(key)) classes += ' selected';
        html += `<td class="${classes}" data-seat="${key}">${row}${c}</td>`;
      }
      html += `<td class="aisle"></td>`;
      for (let c = 4; c <= 6; c++) {
        const key = row + '-' + c;
        const status = state.seatStatusMap[key] || '空';
        let classes = 'seat';
        if (status === '確保' || status === 'unavailable') classes += ' disabled';
        if (state.selectedSeats.includes(key)) classes += ' selected';
        html += `<td class="${classes}" data-seat="${key}">${row}${c}</td>`;
      }
      html += `<td class="aisle"></td>
        <td class="aisle"></td>
        <td class="aisle"></td>`;
    }
    html += '</tr>';
  }
  table.innerHTML = html;
  bindSeatClicks();
  document.getElementById('selectedSeats').value = state.selectedSeats.join(',');
}

function bindSeatClicks() {
  document.querySelectorAll('.seat-table .seat:not(.aisle):not(.disabled)').forEach(cell => {
    cell.onclick = function() {
      const seat = this.dataset.seat;
      const idx = state.selectedSeats.indexOf(seat);
      if (idx >= 0) {
        state.selectedSeats.splice(idx, 1);
        this.classList.remove('selected');
      } else {
        state.selectedSeats.push(seat);
        this.classList.add('selected');
      }
      document.getElementById('selectedSeats').value = state.selectedSeats.join(',');
    };
  });
}

document.getElementById('seatsForm').onsubmit = async function(e) {
  e.preventDefault();
  const classNo = this.class.value;
  const name = this.name.value.trim();
  const mail = this.mail.value.trim();
  if (!classNo) { alert('クラスを選択してください'); return; }
  if (!name || !mail) { alert('必須項目を記入してください'); return; }
  if (state.selectedSeats.length === 0) { alert('座席を1つ以上選んでください'); return; }

  const selArr = state.selectedSeats.map(s => {
    const parts = s.split('-');
    return { row: parts[0], col: Number(parts[1]) };
  });

  const resultEl = document.getElementById('result');
  const submitBtn = document.getElementById('submitBtn');
  resultEl.textContent = '申込しています...';
  submitBtn.disabled = true;

  try {
    const msg = await GasAPI.submitSelectedSeats(group, day, timeslot, classNo, name, mail, selArr);
    resultEl.textContent = msg || '申込が完了しました';
    state.selectedSeats = [];
    const data = await GasAPI.getSeatData(group, day, timeslot, false);
    buildSeatMap(data.seats);
  } catch (err) {
    resultEl.textContent = '申込に失敗しました。時間をおいて再度お試しください。';
  } finally {
    submitBtn.disabled = false;
  }
};


