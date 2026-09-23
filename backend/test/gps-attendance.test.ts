import assert from 'node:assert/strict';
import test from 'node:test';

// Test implementation of Haversine formula (matching AttendanceService)
function calculateHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

// Test implementation of Attendance calculation logic (matching AttendanceService)
function calculateAttendanceMetrics(
  shift: { startTime?: string; endTime?: string; standardHours?: number; breakMinutes?: number } | null,
  log: { checkIn?: Date | string | null; checkOut?: Date | string | null } | null,
) {
  if (!log || !log.checkIn) {
    return {
      workday: 0,
      effectiveHours: 0,
      lateMinutes: 0,
      earlyMinutes: 0,
      status: shift ? 'ABSENT' : 'OFF',
    };
  }

  const checkInDate = new Date(log.checkIn);
  const checkOutDate = log.checkOut ? new Date(log.checkOut) : null;

  let lateMinutes = 0;
  let earlyMinutes = 0;

  if (shift && shift.startTime) {
    const [startH, startM] = shift.startTime.split(':').map(Number);
    const expectedStartMinutes = startH * 60 + startM;
    const actualStartMinutes = checkInDate.getHours() * 60 + checkInDate.getMinutes();
    if (actualStartMinutes > expectedStartMinutes) {
      lateMinutes = actualStartMinutes - expectedStartMinutes;
    }
  }

  if (shift && shift.endTime && checkOutDate) {
    const [endH, endM] = shift.endTime.split(':').map(Number);
    const expectedEndMinutes = endH * 60 + endM;
    const actualEndMinutes = checkOutDate.getHours() * 60 + checkOutDate.getMinutes();
    if (actualEndMinutes < expectedEndMinutes) {
      earlyMinutes = expectedEndMinutes - actualEndMinutes;
    }
  }

  if (!checkOutDate) {
    return {
      workday: 0,
      effectiveHours: 0,
      lateMinutes,
      earlyMinutes: 0,
      status: 'MISSING_CHECKOUT',
    };
  }

  const durationMs = checkOutDate.getTime() - checkInDate.getTime();
  const rawHours = Math.max(0, durationMs / (1000 * 60 * 60));
  const breakHours = ((shift?.breakMinutes ?? 0) > 0 && rawHours > 5) ? (shift!.breakMinutes! / 60) : 0;
  const effectiveHours = Math.max(0, Math.round((rawHours - breakHours) * 100) / 100);

  const standardHours = shift?.standardHours ?? 8;
  let workday = 0;
  if (effectiveHours >= standardHours * 0.85) {
    workday = 1.0;
  } else if (effectiveHours >= standardHours * 0.4) {
    workday = 0.5;
  } else if (effectiveHours > 0) {
    workday = Math.round((effectiveHours / standardHours) * 100) / 100;
  }

  let status = 'ON_TIME';
  if (lateMinutes > 0 && earlyMinutes > 0) {
    status = 'LATE_AND_EARLY';
  } else if (lateMinutes > 0) {
    status = 'LATE';
  } else if (earlyMinutes > 0) {
    status = 'EARLY';
  }

  return {
    workday,
    effectiveHours,
    lateMinutes,
    earlyMinutes,
    status,
  };
}

test('calculateHaversineDistance correctly computes distance in meters', () => {
  // Same point
  const distZero = calculateHaversineDistance(16.0544, 108.2022, 16.0544, 108.2022);
  assert.equal(distZero, 0);

  // Da Nang HQ (16.0544, 108.2022) to Branch (16.0600, 108.2100)
  const distBranch = calculateHaversineDistance(16.0544, 108.2022, 16.0600, 108.2100);
  assert.ok(distBranch > 900 && distBranch < 1100, `Expected distance ~1035m, got ${distBranch}`);

  // Point within 100m radius
  const distClose = calculateHaversineDistance(16.0544, 108.2022, 16.0546, 108.2024);
  assert.ok(distClose < 100, `Expected close distance < 100m, got ${distClose}`);
});

test('calculateAttendanceMetrics returns ABSENT when no log exists', () => {
  const shift = { startTime: '08:00', endTime: '17:30', standardHours: 8, breakMinutes: 90 };
  const res = calculateAttendanceMetrics(shift, null);
  assert.equal(res.status, 'ABSENT');
  assert.equal(res.workday, 0);
  assert.equal(res.effectiveHours, 0);
});

test('calculateAttendanceMetrics returns MISSING_CHECKOUT and 0 workday when check-out is missing', () => {
  const shift = { startTime: '08:00', endTime: '17:30', standardHours: 8, breakMinutes: 90 };
  const checkIn = new Date('2026-09-23T08:15:00.000Z');
  const res = calculateAttendanceMetrics(shift, { checkIn, checkOut: null });
  assert.equal(res.status, 'MISSING_CHECKOUT');
  assert.equal(res.workday, 0);
  assert.equal(res.effectiveHours, 0);
});

test('calculateAttendanceMetrics calculates full day 1.0 on complete on-time shift', () => {
  const shift = { startTime: '08:00', endTime: '17:30', standardHours: 8, breakMinutes: 90 };
  const checkIn = new Date(2026, 8, 23, 8, 0, 0);
  const checkOut = new Date(2026, 8, 23, 17, 30, 0);
  const res = calculateAttendanceMetrics(shift, { checkIn, checkOut });
  assert.equal(res.status, 'ON_TIME');
  assert.equal(res.workday, 1.0);
  assert.equal(res.effectiveHours, 8.0);
  assert.equal(res.lateMinutes, 0);
  assert.equal(res.earlyMinutes, 0);
});

test('calculateAttendanceMetrics calculates half day 0.5 workday', () => {
  const shift = { startTime: '08:00', endTime: '17:30', standardHours: 8, breakMinutes: 90 };
  const checkIn = new Date(2026, 8, 23, 8, 0, 0);
  const checkOut = new Date(2026, 8, 23, 12, 0, 0);
  const res = calculateAttendanceMetrics(shift, { checkIn, checkOut });
  assert.equal(res.workday, 0.5);
  assert.equal(res.effectiveHours, 4.0);
  assert.equal(res.earlyMinutes, 330);
  assert.equal(res.status, 'EARLY');
});
