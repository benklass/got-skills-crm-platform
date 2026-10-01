







// ============================================================







// DYNAMIC CRM CALENDAR COMPONENT







// ============================================================







//







// This component displays three categories of CRM records:







//







// 1. Courses







// 2. Payments







// 3. Enrollments







//







// The records are retrieved dynamically from the backend API,







// transformed into Calendar events and displayed using







// React Big Calendar.







//







// IMPLEMENTED FEATURES:



//



// COURSE TIME EXTENSION - STEP 11:



// Generate one local timed Course occurrence for every calendar day



// in the Course date range, inclusive.



//



// PAYMENT / ENROLLMENT TIME EXTENSION - STEP 12:



// Display each Payment at transactionDate and each Enrollment at



// enrollmentDate, with a calculated 15-minute duration.

//

// DYNAMIC TOTALS PRESERVATION - STEP 13:

// Keep the summary cards record-based after Courses were expanded into

// daily occurrences and Payments/Enrollments became timed intervals.

// A Course counts once in every displayed reporting period that it overlaps,

// regardless of how many daily Calendar occurrences it generates.







//







// Steps 1–4:  Retrieve records from the backend API.







// Step 5:     Transform Courses into Calendar events.







// Step 6:     Transform Payments into Calendar events.







// Step 7:     Transform Enrollments into Calendar events.







// Steps 8–9: Calculate and display record/event totals.







// Step 10:    Display dynamic events in React Big Calendar.







// Step 11:    Distinguish event types using titles and colors.







// Step 12:    Handle loading, success, empty and error states.







// Step 13:    Preserve references to original CRM records.







// Step 14:    Open colored event-detail pop-ups with CRM record links.







//







// EVENT COLORS:







//







// Courses     = Blue







// Payments    = Green







// Enrollments = Yellow







//







// ============================================================























// ============================================================







// 1. IMPORT REACT AND REACT HOOKS







// ============================================================















// useState:







// Stores information that can change while the component runs.







//







// useEffect:







// Executes the API retrieval operation when the component mounts.















import React, { useState, useEffect } from "react";















// Navigate to existing CRM record pages without reloading the app.







// Record links are ordinary anchors so they can open in a new tab.







// No React Router Link import is required here.























// ============================================================







// 2. IMPORT REACT BIG CALENDAR







// ============================================================















// Calendar:







// Displays the CRM events in a Calendar interface.







//







// momentLocalizer:







// Connects React Big Calendar to Moment for date formatting.















import {







  Calendar,







  momentLocalizer,







  Views,







} from "react-big-calendar";















import moment from "moment";























// Import the default React Big Calendar stylesheet.







//







// Without this stylesheet, the Calendar may appear incorrectly







// formatted.















import "react-big-calendar/lib/css/react-big-calendar.css";























// ============================================================







// 3. IMPORT APPLICATION DATA SERVICES







// ============================================================















// Retrieves all Product/Course records.







//







// Backend endpoint:







// GET /api/products















import { getProducts } from "../services/productService";























// Retrieves all Payment records.







//







// Backend endpoint:







// GET /api/payments















import { getPayments } from "../services/paymentService";























// Retrieves ALL Enrollment records.







//







// This includes completed and incomplete enrollments,







// regardless of whether they have been paid.







//







// Backend endpoint:







// GET /api/enrollments/all







//







// IMPORTANT:







//







// getEnrollments() retrieves only incomplete enrollments.







//







// We use getAllPaidNotPaidEnrollments() because the Calendar







// must represent the complete enrollment history.















import {







  getAllPaidNotPaidEnrollments,







} from "../services/enrollmentService";























// ============================================================







// 4. CONFIGURE THE CALENDAR LOCALIZER







// ============================================================















// React Big Calendar requires a localizer to interpret







// and display dates and times.







//







// Moment provides date formatting and localization.







//







// The localizer is created outside MyCalendar because it







// does not need to be recreated whenever the component renders.















const localizer = momentLocalizer(moment);

// ============================================================
// ASSORTED CALENDAR FEATURES:
// DAY/WEEK PAYMENT + ENROLLMENT CARD TIME REMOVAL
// ============================================================
//
// React Big Calendar normally renders a separate .rbc-event-label containing
// the event time in Day and Week views. Payment and Enrollment cards already
// display a compact Student-first cardTitle (maximum 20 characters), so that
// extra time label is hidden for those two categories.
//
// Course events keep their normal time label.
//
// The actual Payment/Enrollment start and end Date objects are NOT changed.
// Their real timestamps still control event positioning, dynamic Calendar
// hours, summary totals and information-pop-up timestamps.
















// Match the Agenda range used by the Calendar below.







const AGENDA_LENGTH_DAYS = 30;

// ============================================================
// ASSORTED CALENDAR FEATURES - STEP 1:
// REUSABLE HELPER CONFIGURATION
// ============================================================
//
// Step 1 deliberately adds only reusable constants and pure helper
// functions. Nothing in the existing event-generation or rendering
// logic uses them yet.
//
// This lets us build the foundation for the later assorted Calendar
// features without destabilizing the working Calendar Time Extension.
//
// Expected result after Step 1:
//
//     The Calendar behaves exactly as it did before this step.
//
// Some of these constants/functions may temporarily produce ESLint
// "defined but never used" warnings. That is expected until later steps
// connect them to the Calendar UI.


// Maximum length that will later be used for compact Payment and
// Enrollment event-card titles.
//
// The full event information will remain available separately.
const CALENDAR_CARD_TITLE_MAX_LENGTH = 20;


// Default working hours used later when a displayed Day or an entire
// displayed Week contains no events.
//
// These values are a FALLBACK only. They will not force populated
// periods to display 08:00-17:00.
//
// Examples:
//
//     No events        -> 08:00-17:00
//     Only 10:00-12:00 -> 10:00-12:00
//
const DEFAULT_CALENDAR_START_HOUR = 8;
const DEFAULT_CALENDAR_END_HOUR = 17;


// Initial display limits for enrolled Students inside Course event
// cards. Different views have different amounts of available space.
//
// These values are configuration only in Step 1. They are not yet
// connected to the event renderer.
// Month-view Course cards contain exactly two information lines:
// Course name, followed by Instructor name. Each line is capped at 20 characters.
const MONTH_COURSE_LINE_MAX_LENGTH = 20;

// Student limits apply only to views that still display enrolled Students.
// Month is intentionally omitted because its Course cards use the compact
// two-line Course/Instructor layout.
const COURSE_STUDENT_LIMITS = {
  week: 3,
  day: 5,
  agenda: 5,
};


// The Course information pop-up has more room than an event card, so
// it can later display a larger number of Student names.
const COURSE_POPUP_STUDENT_LIMIT = 10;


// ============================================================
// ASSORTED CALENDAR FEATURES - STEP 1:
// HELPER - TRUNCATE A CALENDAR-CARD TITLE
// ============================================================
//
// Returns a shortened copy of a title when it exceeds maxLength.
//
// The ellipsis is INCLUDED in maxLength.
//
// Example:
//
//     maxLength = 20
//
//     first 17 characters + "..." = 20 characters
//
// This helper is pure:
// - it does not modify React state;
// - it does not modify the original CRM record;
// - it does not modify the original Calendar event.
function truncateCalendarTitle(
  title,
  maxLength = CALENDAR_CARD_TITLE_MAX_LENGTH
) {
  // Convert null/undefined/other values into a predictable string.
  const safeTitle = String(title || "");

  // Return the original string when it already fits.
  if (safeTitle.length <= maxLength) {
    return safeTitle;
  }

  // For an unusually small limit, there is no room for a three-character
  // ellipsis, so simply cut the string to the requested length.
  if (maxLength <= 3) {
    return safeTitle.slice(0, maxLength);
  }

  // Reserve the final three characters for "...".
  return `${safeTitle.slice(0, maxLength - 3)}...`;
}




// ============================================================

// STEP 12: TIMED PAYMENT AND ENROLLMENT EVENT DURATION

// ============================================================



// Payments and Enrollments represent individual recorded actions.

// They do not contain a separate event end timestamp, so each one is

// displayed for 15 minutes beginning at its actual recorded timestamp.

//

// 15 minutes * 60 seconds * 1000 milliseconds = 900,000 ms.



const TRANSACTION_EVENT_DURATION_MS = 15 * 60 * 1000;















// Return a half-open date range [start, end) for the selected view.







// Moment's locale-aware week start should match the Moment localizer.







function getCalendarDateRange(date, view) {







  const selected = moment(date);







  switch (view) {







    case Views.WEEK: {







      const start = selected.clone().startOf("week");







      return { start: start.toDate(), end: start.clone().add(1, "week").toDate() };







    }







    case Views.DAY: {







      const start = selected.clone().startOf("day");







      return { start: start.toDate(), end: start.clone().add(1, "day").toDate() };







    }







    case Views.AGENDA: {







      const start = selected.clone().startOf("day");







      return {







        start: start.toDate(),







        end: start.clone().add(AGENDA_LENGTH_DAYS, "days").toDate(),







      };







    }







    case Views.MONTH:







    default: {







      const start = selected.clone().startOf("month");







      return { start: start.toDate(), end: start.clone().add(1, "month").toDate() };







    }







  }







}

































// ============================================================
// ASSORTED CALENDAR FEATURES - STEP 1:
// HELPER - GET EVENTS IN A DATE RANGE
// ============================================================
//
// Returns Calendar events that overlap the supplied half-open range:
//
//     [rangeStart, rangeEnd)
//
// An event overlaps that range when:
//
//     event.start < rangeEnd
//
// AND:
//
//     event.end > rangeStart
//
// This helper is intended for later DISPLAY calculations, such as
// finding which events need vertical time-grid space in Day/Week view.
//
// IMPORTANT:
// This helper does NOT replace or alter the existing Step 13 totals
// logic in Step 1.
function getEventsInDateRange(
  events,
  rangeStart,
  rangeEnd
) {
  // Return an empty array if the caller did not supply an event array.
  if (!Array.isArray(events)) {
    return [];
  }

  return events.filter((event) => {
    // Ignore malformed events that do not contain Date objects.
    if (
      !(event.start instanceof Date) ||
      !(event.end instanceof Date)
    ) {
      return false;
    }

    // Ignore Invalid Date values.
    if (
      Number.isNaN(event.start.getTime()) ||
      Number.isNaN(event.end.getTime())
    ) {
      return false;
    }

    // Standard half-open interval-overlap test.
    return (
      event.start < rangeEnd &&
      event.end > rangeStart
    );
  });
}


// ============================================================
// ASSORTED CALENDAR FEATURES - STEP 7:
// CALCULATE DYNAMIC MINIMUM AND MAXIMUM HOURS
// ============================================================
//
// Examines the events relevant to the currently displayed Day or Week
// and determines the continuous clock-time range that must remain visible.
//
// IMPORTANT FOR WEEK VIEW:
//
// We compare TIME OF DAY, not complete Date objects.
//
// Example:
//
// Monday event:  10:00-12:00
// Friday event:  08:00-09:00
//
// The required Week time scale is:
//
//     08:00-12:00
//
// Comparing complete Date objects would incorrectly treat Monday as
// "earlier" merely because Monday occurs before Friday. Converting each
// time to minutes since midnight lets us compare the clock times directly.
//
// If there are no relevant events, the agreed fallback is 08:00-17:00.
//
// Empty gaps BETWEEN events are intentionally preserved. If one event
// occurs at 01:00 and another ends at 08:00, the entire 01:00-08:00
// interval remains visible.
function getDynamicCalendarHours(events) {
  // Keep only events with valid Date start/end values.
  const validEvents = Array.isArray(events)
    ? events.filter(
        (event) =>
          event.start instanceof Date &&
          event.end instanceof Date &&
          !Number.isNaN(event.start.getTime()) &&
          !Number.isNaN(event.end.getTime())
      )
    : [];

  // No events -> use the agreed normal working-hours fallback.
  if (validEvents.length === 0) {
    return {
      startHour: DEFAULT_CALENDAR_START_HOUR,
      startMinute: 0,
      endHour: DEFAULT_CALENDAR_END_HOUR,
      endMinute: 0,
    };
  }

  // These begin as null because no event has been examined yet.
  let earliestStartMinutes = null;
  let latestEndMinutes = null;

  validEvents.forEach((event) => {
    // Convert the event's start clock time to minutes since midnight.
    //
    // Example:
    // 08:30 -> (8 * 60) + 30 -> 510
    const eventStartMinutes =
      event.start.getHours() * 60 +
      event.start.getMinutes();

    // Convert the event's end clock time in the same way.
    const eventEndMinutes =
      event.end.getHours() * 60 +
      event.end.getMinutes();

    // Keep the smallest start-time value encountered so far.
    //
    // The null check handles the first valid event.
    if (
      earliestStartMinutes === null ||
      eventStartMinutes < earliestStartMinutes
    ) {
      earliestStartMinutes = eventStartMinutes;
    }

    // Keep the largest end-time value encountered so far.
    //
    // Again, the null check handles the first valid event.
    if (
      latestEndMinutes === null ||
      eventEndMinutes > latestEndMinutes
    ) {
      latestEndMinutes = eventEndMinutes;
    }
  });

  // Convert the minute counts back into hour/minute components.
  //
  // Example:
  // 510 minutes -> 08:30
  return {
    startHour: Math.floor(earliestStartMinutes / 60),
    startMinute: earliestStartMinutes % 60,
    endHour: Math.floor(latestEndMinutes / 60),
    endMinute: latestEndMinutes % 60,
  };
}


// ============================================================
// ASSORTED CALENDAR FEATURES - STEP 9:
// GROUP ENROLLMENTS BY COURSE ID
// ============================================================
//
// The Calendar already retrieves all Enrollment records. Rather than
// making a separate API request for every Course, later steps can group
// those existing Enrollment records once:
//
//     {
//       courseId1: [enrollment1, enrollment2],
//       courseId2: [enrollment3]
//     }
//
// Each Enrollment contains an embedded Product/Course snapshot in
// enrollment.product. Its _id identifies the Course.
function groupEnrollmentsByCourseId(enrollments) {
  const groupedEnrollments = {};

  // Defensive guard for missing/non-array input.
  if (!Array.isArray(enrollments)) {
    return groupedEnrollments;
  }

  enrollments.forEach((enrollment) => {
    const courseId =
      enrollment &&
      enrollment.product &&
      enrollment.product._id;

    // Ignore malformed Enrollment records that cannot be associated
    // with a Course.
    if (!courseId) {
      return;
    }

    // MongoDB ObjectIds arrive through JSON as strings. String() gives
    // us a consistent object key either way.
    const courseKey = String(courseId);

    // Create the Course's array the first time its ID is encountered.
    if (!groupedEnrollments[courseKey]) {
      groupedEnrollments[courseKey] = [];
    }

    groupedEnrollments[courseKey].push(enrollment);
  });

  return groupedEnrollments;
}


// ============================================================
// ASSORTED CALENDAR FEATURES - STEP 9:
// DEDUPLICATE STUDENTS FROM A COURSE'S ENROLLMENTS
// ============================================================
//
// Converts a Course's Enrollment records into a unique Student list.
//
// Students are deduplicated by the embedded Customer _id so that a
// duplicate Enrollment record does not display the same Student name
// repeatedly.
//
// Example return value:
//
//     [
//       { _id: "abc123", name: "Benjamin Klass" },
//       { _id: "def456", name: "Sarah Cohen" }
//     ]
//
function getUniqueStudentsFromEnrollments(enrollments) {
  if (!Array.isArray(enrollments)) {
    return [];
  }

  const studentsById = {};

  enrollments.forEach((enrollment) => {
    const customer =
      enrollment &&
      enrollment.customer;

    // A Student needs both an ID for reliable deduplication and a name
    // for display.
    if (
      !customer ||
      !customer._id ||
      !customer.name
    ) {
      return;
    }

    const customerKey = String(customer._id);

    // Keep the first occurrence of each Student.
    if (!studentsById[customerKey]) {
      studentsById[customerKey] = {
        _id: customerKey,
        name: customer.name,
      };
    }
  });

  return Object.values(studentsById);
}


// ============================================================
// ASSORTED CALENDAR FEATURES - STEP 1:
// HELPER - CALCULATE VISIBLE STUDENTS AND OVERFLOW
// ============================================================
//
// Splits a Student list into:
//
// 1. Students that can be shown in the available UI space.
// 2. The number of Students that remain hidden.
//
// Example:
//
//     8 Students, limit 3
//
// becomes:
//
//     {
//       visibleStudents: [first 3 Students],
//       remainingCount: 5
//     }
//
// A later rendering step can turn remainingCount into:
//
//     + 5 more students
//
// Keeping the text rendering out of this helper separates data
// calculation from UI presentation.
function getVisibleStudents(students, limit) {
  const safeStudents = Array.isArray(students)
    ? students
    : [];

  // Invalid or negative limits become zero.
  const safeLimit =
    Number.isInteger(limit) && limit >= 0
      ? limit
      : 0;

  const visibleStudents = safeStudents.slice(
    0,
    safeLimit
  );

  const remainingCount = Math.max(
    safeStudents.length - visibleStudents.length,
    0
  );

  return {
    visibleStudents,
    remainingCount,
  };
}


// ============================================================







// STEP 11: COURSE DATE/TIME HELPER FUNCTIONS







// ============================================================







// Course startDate and endDate values are stored by the backend as



// ISO date strings, for example:



//



// 2026-10-01T00:00:00.000Z



//



// For Course scheduling, the YYYY-MM-DD portion represents the intended



// CALENDAR DAY. We therefore extract those written date components instead



// of first converting the value to local time. Converting midnight UTC to



// local time first could move the date to the previous or following day in



// some time zones.



function getCalendarDateParts(dateValue) {







  // Convert the value to text and retain only YYYY-MM-DD.



  const dateString = String(dateValue).slice(0, 10);







  // Split YYYY-MM-DD into numeric components.



  const [year, month, day] = dateString



    .split("-")



    .map(Number);







  return { year, month, day };



}















// Combine one Course calendar date with one HH:mm time value.



// The numeric Date constructor intentionally creates LOCAL wall-clock time.



function combineCalendarDateAndTime(year, month, day, timeValue) {







  const [hours, minutes] = timeValue



    .split(":")



    .map(Number);







  return new Date(



    year,



    month - 1,



    day,



    hours,



    minutes,



    0,



    0



  );



}















// Expand one Course into one timed event for EVERY calendar day from



// startDate through endDate, including the final day.



function createDailyCourseEvents(course, students = []) {







  const events = [];







  // Guard against incomplete records. The updated backend should provide all



  // four fields, but malformed data should not crash the Calendar.



  if (



    !course.startDate ||



    !course.endDate ||



    !course.startTime ||



    !course.endTime



  ) {



    return events;



  }







  const startParts = getCalendarDateParts(course.startDate);



  const endParts = getCalendarDateParts(course.endDate);







  if (



    !Number.isFinite(startParts.year) ||



    !Number.isFinite(startParts.month) ||



    !Number.isFinite(startParts.day) ||



    !Number.isFinite(endParts.year) ||



    !Number.isFinite(endParts.month) ||



    !Number.isFinite(endParts.day)



  ) {



    return events;



  }







  // Use local noon while stepping through days. setDate() advances by a local



  // calendar day rather than by a fixed 24-hour millisecond duration.



  const currentDate = new Date(



    startParts.year,



    startParts.month - 1,



    startParts.day,



    12, 0, 0, 0



  );







  const finalDate = new Date(



    endParts.year,



    endParts.month - 1,



    endParts.day,



    12, 0, 0, 0



  );







  if (



    Number.isNaN(currentDate.getTime()) ||



    Number.isNaN(finalDate.getTime()) ||



    finalDate < currentDate



  ) {



    return events;



  }







  // <= is deliberate so the Course's final date is included.



  while (currentDate <= finalDate) {







    const year = currentDate.getFullYear();



    const month = currentDate.getMonth() + 1;



    const day = currentDate.getDate();







    const eventStart = combineCalendarDateAndTime(



      year, month, day, course.startTime



    );







    const eventEnd = combineCalendarDateAndTime(



      year, month, day, course.endTime



    );







    const occurrenceDate = [



      year,



      String(month).padStart(2, "0"),



      String(day).padStart(2, "0"),



    ].join("-");







    events.push({



      // Unique Calendar occurrence ID.



      id: `${course._id}-${occurrenceDate}`,







      // Preserve the existing Course event category/color.



      type: "course",







      // Preserve Course and instructor information.



      title: `${course.name} - Instructor: ${



        course.instructor?.name || "Not available"



      }`,







      // Exact local daily hours.



      start: eventStart,



      end: eventEnd,



      allDay: false,







      // All occurrences still point to the same CRM Course record.



      recordId: course._id,



      recordUrl: `/products/${course._id}`,



      course: course,



      // ======================================================
      // ASSORTED CALENDAR FEATURES - STEP 9:
      // ENROLLED STUDENTS
      // ======================================================
      //
      // Every daily occurrence represents the same underlying Course,
      // so every occurrence receives the same deduplicated Student
      // collection derived from the already-loaded Enrollments.
      //
      // No additional API request is made here.
      students: students,

    });







    // Move to the next LOCAL calendar day.



    currentDate.setDate(currentDate.getDate() + 1);



  }







  return events;



}







































// ============================================================







// STEP 14: FORMAT DATES AND DECIMAL AMOUNTS IN EVENT DETAILS







// ============================================================















// The pop-up displays the actual transaction/enrollment date rather







// than the artificial end date used to display one-day events.







function formatEventDate(dateValue) {







  if (!dateValue) return "Not available";







  const date = new Date(dateValue);







  return Number.isNaN(date.getTime())







    ? "Invalid date"







    : moment(date).format("DD MMMM YYYY");







}



// ============================================================

// STEP 12: FORMAT AN EXACT EVENT TIMESTAMP

// ============================================================



// Payments and Enrollments retain their actual recorded time.

// This helper displays both the local calendar date and local clock time.

//

// Example:

//

//     21 August 2023 09:54

//

// Course start/end dates continue using formatEventDate() because they

// represent calendar dates rather than transaction timestamps.



function formatEventDateTime(dateValue) {



  if (!dateValue) return "Not available";



  const date = new Date(dateValue);



  return Number.isNaN(date.getTime())

    ? "Invalid date"

    : moment(date).format("DD MMMM YYYY HH:mm");



}















// MongoDB Decimal128 values are normally serialized as







// { $numberDecimal: "2500.00" }; accept ordinary numbers too.







function formatAmount(value) {







  if (value === null || value === undefined || value === "") {







    return "Not available";







  }







  const raw = typeof value === "object" ? value.$numberDecimal : value;







  const number = Number(raw);







  return Number.isFinite(number)







    ? `R ${number.toLocaleString("en-ZA", {







        minimumFractionDigits: 2,







        maximumFractionDigits: 2,







      })}`







    : "Not available";







}























// ============================================================







// 5. CREATE THE CALENDAR COMPONENT







// ============================================================















// MyCalendar is a React functional component.







//







// It retrieves CRM records, transforms them into Calendar







// events, calculates totals and renders the Calendar interface.















// ============================================================
// ASSORTED CALENDAR FEATURES - STEP 4:
// CUSTOM CALENDAR EVENT-CARD RENDERER
// ============================================================
//
// React Big Calendar normally renders event.title inside each event card.
// Payment and Enrollment events also contain cardTitle, a compact
// Student-first title of no more than 20 characters. Course events do not
// contain cardTitle and therefore continue to display event.title.
//
// This affects Calendar cards only; event.title remains unchanged for pop-ups.
function CalendarEventCard({ event, calendarView }) {
  // ==========================================================
  // ASSORTED CALENDAR FEATURES - STEP 10:
  // DISPLAY ENROLLED STUDENTS ON COURSE CARDS
  // ==========================================================
  //
  // Step 9 already attached a deduplicated students array to
  // every generated Course occurrence. Step 10 only renders it.

  if (event.type === "course") {
    // ========================================================
    // MONTH VIEW: COMPACT TWO-LINE COURSE CARD
    // ========================================================
    //
    // Employer requirement for Month view only:
    //   Line 1 -> Course name (maximum 20 characters)
    //   Line 2 -> Instructor name (maximum 20 characters)
    //
    // Student names and the "+ X more students" line are omitted
    // from Month cards. The underlying event.students collection is
    // left untouched for the popup and all other Calendar views.
    if (calendarView === Views.MONTH) {
      const courseName =
        event.course?.name || "Course not available";

      const instructorName =
        event.course?.instructor?.name ||
        "Instructor not available";

      const monthCourseName = truncateCalendarTitle(
        courseName,
        MONTH_COURSE_LINE_MAX_LENGTH
      );

      const monthInstructorName = truncateCalendarTitle(
        instructorName,
        MONTH_COURSE_LINE_MAX_LENGTH
      );

      return (
        <div title={event.title}>
          <div>
            <strong>{monthCourseName}</strong>
          </div>
          <div>{monthInstructorName}</div>
        </div>
      );
    }

    // WEEK / DAY / AGENDA:
    // Preserve the existing Course-card Student-list behavior.
    const studentLimit =
      COURSE_STUDENT_LIMITS[calendarView] ?? 2;

    const {
      visibleStudents,
      remainingCount,
    } = getVisibleStudents(
      event.students,
      studentLimit
    );

    return (
      <div title={event.title}>
        <div>
          <strong>{event.title}</strong>
        </div>

        {visibleStudents.map((student) => (
          <div key={String(student._id)}>
            {student.name}
          </div>
        ))}

        {remainingCount > 0 && (
          <div>
            + {remainingCount} more{" "}
            {remainingCount === 1
              ? "student"
              : "students"}
          </div>
        )}
      </div>
    );
  }

  // Preserve the existing Step 4/5 Payment and Enrollment behavior.
  const displayedTitle = event.cardTitle || event.title;

  return (
    <span title={event.title}>
      {displayedTitle}
    </span>
  );
}


const MyCalendar = () => {















  // ==========================================================







  // STEP 3: CREATE REACT STATE







  // ==========================================================















  // ----------------------------------------------------------







  // COURSE STATE







  // ----------------------------------------------------------















  // courses:







  // Stores Product/Course records retrieved from MongoDB.







  //







  // setCourses:







  // Updates the courses array after the HTTP request succeeds.







  //







  // useState([]):







  // Initializes courses as an empty array.















  const [courses, setCourses] = useState([]);























  // ----------------------------------------------------------







  // PAYMENT STATE







  // ----------------------------------------------------------















  // Stores all Payment records returned by the backend.















  const [payments, setPayments] = useState([]);























  // ----------------------------------------------------------







  // ENROLLMENT STATE







  // ----------------------------------------------------------















  // Stores all Enrollment records returned by the backend.







  //







  // Includes:







  // - Completed enrollments







  // - Incomplete enrollments







  // - Paid enrollments







  // - Unpaid enrollments















  const [enrollments, setEnrollments] = useState([]);























  // ==========================================================







  // STEP 12: LOADING AND ERROR STATES







  // ==========================================================















  // ----------------------------------------------------------







  // LOADING STATE







  // ----------------------------------------------------------















  // Tracks whether the initial API requests are still running.







  //







  // true  = Calendar data is being retrieved.







  // false = all three API requests have settled.















  const [loading, setLoading] = useState(true);























  // ----------------------------------------------------------







  // CATEGORY-SPECIFIC ERROR STATE







  // ----------------------------------------------------------















  // Stores an error message for each record category.







  //







  // An empty string indicates that no error has been recorded.







  //







  // Separate errors allow successfully retrieved categories







  // to remain visible even if another category fails.















  const [errors, setErrors] = useState({







    courses: "",







    payments: "",







    enrollments: "",







  });























  // ==========================================================







  // STEP 14: SELECTED EVENT AND POP-UP CONTROLS







  // ==========================================================















  // null hides the pop-up; clicking an event stores its full event







  // object, including its original CRM record and recordUrl.







  const [selectedEvent, setSelectedEvent] = useState(null);















  // Control both the selected date and view so the summary follows navigation.







  const [calendarDate, setCalendarDate] = useState(new Date());







  const [calendarView, setCalendarView] = useState(Views.MONTH);







  const handleNavigate = (nextDate) => setCalendarDate(nextDate);







  const handleViewChange = (nextView) => setCalendarView(nextView);















  // React Big Calendar passes the clicked event to this handler.







  const handleSelectEvent = (event) => setSelectedEvent(event);















  // Closing the pop-up clears the selected event.







  const handleCloseEvent = () => setSelectedEvent(null);

  // ==========================================================
  // ASSORTED CALENDAR FEATURES - STEP 11:
  // COURSE POP-UP STUDENT LIST
  // ==========================================================
  //
  // Course Calendar events already contain the deduplicated
  // Student collection created in Step 9:
  //
  //     selectedEvent.students
  //
  // Therefore, the pop-up does NOT retrieve or derive Students
  // again. It applies a larger display limit to the same Student
  // collection used by the Course Calendar card.
  const popupStudentDisplay =
    selectedEvent?.type === "course"
      ? getVisibleStudents(
          selectedEvent.students,
          COURSE_POPUP_STUDENT_LIMIT
        )
      : {
          visibleStudents: [],
          remainingCount: 0,
        };























  // ==========================================================







  // STEP 4 + STEP 12:







  // RETRIEVE CALENDAR DATA AND HANDLE API FAILURES







  // ==========================================================















  // useEffect runs when the Calendar component mounts.







  //







  // The empty dependency array [] means that the effect







  // is not repeated because of ordinary state updates.







  //







  // React development Strict Mode may run the effect







  // more than once to check cleanup behavior.







  //







  // The effect retrieves Courses, Payments and Enrollments.







  //







  // Promise.allSettled() allows the three requests to







  // succeed or fail independently.







  //







  // If Payments fail, for example, successfully retrieved







  // Course and Enrollment records can still be displayed.















  useEffect(() => {















    // Prevent state updates after the component unmounts.







    let isMounted = true;























    // --------------------------------------------------------







    // ASYNCHRONOUS DATA-LOADING FUNCTION







    // --------------------------------------------------------















    const loadCalendarData = async () => {















      // Indicate that the Calendar is loading.







      setLoading(true);















      // Clear any previous error messages.







      setErrors({







        courses: "",







        payments: "",







        enrollments: "",







      });























      // ------------------------------------------------------







      // RETRIEVE ALL THREE RECORD CATEGORIES







      // ------------------------------------------------------















      // Each service function returns an Axios promise.







      //







      // Promise.allSettled() waits until every request







      // has either succeeded or failed.







      //







      // Unlike Promise.all(), one rejected request does not







      // prevent us from processing the other results.















      const results = await Promise.allSettled([







        getProducts(),







        getPayments(),







        getAllPaidNotPaidEnrollments(),







      ]);























      // ------------------------------------------------------







      // CHECK WHETHER THE COMPONENT IS STILL MOUNTED







      // ------------------------------------------------------















      // Stop processing if the user navigated away from







      // the Calendar before the requests finished.















      if (!isMounted) return;























      // ------------------------------------------------------







      // EXTRACT THE INDIVIDUAL API RESULTS







      // ------------------------------------------------------















      // The results correspond to the order in which







      // the three requests were supplied.















      const [







        coursesResult,







        paymentsResult,







        enrollmentsResult,







      ] = results;























      // ------------------------------------------------------







      // PROCESS COURSE RESPONSE







      // ------------------------------------------------------















      if (coursesResult.status === "fulfilled") {















        // Extract the Course records from the Axios response.







        const courseData = coursesResult.value.data;















        // Store the retrieved records in React state.







        setCourses(courseData);















      } else {















        // Log the actual error for debugging.







        console.error(







          "Unable to retrieve Courses:",







          coursesResult.reason







        );















        // Clear the Course array if retrieval failed.







        setCourses([]);







      }























      // ------------------------------------------------------







      // PROCESS PAYMENT RESPONSE







      // ------------------------------------------------------















      if (paymentsResult.status === "fulfilled") {















        // Extract the Payment records from the Axios response.







        const paymentData = paymentsResult.value.data;















        // Store the retrieved records in React state.







        setPayments(paymentData);















      } else {















        // Log the actual error for debugging.







        console.error(







          "Unable to retrieve Payments:",







          paymentsResult.reason







        );















        // Clear the Payment array if retrieval failed.







        setPayments([]);







      }























      // ------------------------------------------------------







      // PROCESS ENROLLMENT RESPONSE







      // ------------------------------------------------------















      if (enrollmentsResult.status === "fulfilled") {















        // Extract all Enrollment records.







        //







        // This includes completed and incomplete enrollments,







        // regardless of payment status.















        const enrollmentData = enrollmentsResult.value.data;















        // Store the retrieved records in React state.







        setEnrollments(enrollmentData);















      } else {















        // Log the actual error for debugging.







        console.error(







          "Unable to retrieve Enrollments:",







          enrollmentsResult.reason







        );















        // Clear the Enrollment array if retrieval failed.







        setEnrollments([]);







      }























      // ------------------------------------------------------







      // STORE CATEGORY-SPECIFIC ERROR MESSAGES







      // ------------------------------------------------------















      // Each error message is determined independently.







      //







      // A successful request receives an empty error string.







      //







      // A failed request receives an appropriate message.















      setErrors({















        courses:







          coursesResult.status === "rejected"







            ? "Unable to load Courses."







            : "",















        payments:







          paymentsResult.status === "rejected"







            ? "Unable to load Payments."







            : "",















        enrollments:







          enrollmentsResult.status === "rejected"







            ? "Unable to load Enrollments."







            : "",















      });























      // ------------------------------------------------------







      // FINISH LOADING







      // ------------------------------------------------------















      // All three API requests have now settled.







      //







      // Some may have succeeded while others failed.







      //







      // React will render the available records together







      // with any relevant error messages.















      setLoading(false);















    };























    // --------------------------------------------------------







    // EXECUTE THE DATA-LOADING FUNCTION







    // --------------------------------------------------------















    // Calling this function starts the three HTTP requests.















    loadCalendarData();























    // --------------------------------------------------------







    // CLEANUP







    // --------------------------------------------------------















    // React calls this function when the component unmounts.







    //







    // This prevents the asynchronous function from updating







    // state after the Calendar has been removed from the page.















    return () => {







      isMounted = false;







    };















  }, []);























  // ==========================================================







  // STEP 11 + STEP 13:







  // GENERATE DAILY TIMED COURSE EVENTS AND PRESERVE RECORD REFERENCES







  // ==========================================================







  // courses contains one Product/Course business record per Course.



  // createDailyCourseEvents() returns an array of daily occurrences for one



  // Course, and flatMap() combines all of those arrays into the single flat



  // event array required by React Big Calendar.



  //



  // Example:



  //



  // Course A -> [Oct 1, Oct 2, Oct 3]



  // Course B -> [Oct 5, Oct 6]



  //



  // flatMap() -> [Oct 1, Oct 2, Oct 3, Oct 5, Oct 6]



  //



  // Multiple daily occurrences still represent ONE underlying Course record.



  // Each occurrence retains the original Course ID, URL, instructor and



  // complete Course object.







  // ==========================================================
  // ASSORTED CALENDAR FEATURES - STEP 9:
  // GROUP ENROLLMENTS BY COURSE AND DERIVE STUDENTS
  // ==========================================================
  //
  // The Calendar already retrieved every Enrollment through the
  // existing /api/enrollments/all request. Each Enrollment contains
  // embedded Course and Student information.
  //
  // Group those already-loaded records once by Course ID. This avoids
  // creating another API endpoint and avoids an N+1 request loop.
  const enrollmentsByCourseId =
    groupEnrollmentsByCourseId(enrollments);

  // Generate daily Course occurrences and attach the Course's
  // deduplicated Student collection to every occurrence.
  //
  // A Course with no matching Enrollments receives students: [].
  const courseEvents = courses.flatMap((course) => {
    const courseKey = String(course._id);

    // Retrieve only the Enrollment records belonging to this Course.
    const courseEnrollments =
      enrollmentsByCourseId[courseKey] || [];

    // Convert those Enrollment records into a unique Student list.
    const courseStudents =
      getUniqueStudentsFromEnrollments(courseEnrollments);

    // The existing Calendar Time Extension still creates the daily
    // occurrences; Step 9 simply supplies the associated Students.
    return createDailyCourseEvents(
      course,
      courseStudents
    );
  });















  // ==========================================================







  // STEP 6 + STEP 13:







  // TRANSFORM PAYMENT RECORDS AND PRESERVE RECORD REFERENCES







  // ==========================================================















  // Each Payment has one relevant Calendar date:







  //







  // transactionDate







  //







  // map() creates one Calendar event for each Payment record.







  //







  // Payments are displayed as all-day events because they







  // represent recorded transactions rather than appointments







  // with a scheduled duration.







  //







  // STEP 13:







  //







  // Each Payment event also retains:







  //







  // - The original MongoDB Payment ID.







  // - The direct URL to this payment’s receipt.







  // - The complete original Payment object.







  //







  // IMPORTANT:







  //







  // The current application has a /payments listing route,







  // but no confirmed dedicated /payments/:id frontend route.







  //







  // Therefore, recordUrl points to the Payments listing page.







  //







  // recordId preserves the exact Payment ID for future







  // record-specific navigation.















  const paymentEvents = payments.map((payment) => {



    // --------------------------------------------------------

    // STEP 12: PAYMENT START TIME

    // --------------------------------------------------------



    // transactionDate is an exact recorded timestamp, so parse it

    // directly instead of converting it to an artificial all-day range.



    const paymentStart = new Date(

      payment.transactionDate

    );



    // --------------------------------------------------------

    // STEP 12: PAYMENT END TIME

    // --------------------------------------------------------



    // Add exactly 15 minutes. Timestamp arithmetic naturally allows

    // an event near midnight to finish on the following calendar day.



    const paymentEnd = new Date(

      paymentStart.getTime() +

        TRANSACTION_EVENT_DURATION_MS

    );



    // --------------------------------------------------------

    // ASSORTED CALENDAR FEATURES - STEP 4:

    // CREATE SHORT PAYMENT CALENDAR-CARD TITLE

    // --------------------------------------------------------

    // Student-first, no date, and a maximum of 20 characters.

    // The full event.title remains available to the information pop-up.

    const paymentStudentName =

      payment.name || "Student not available";

    const paymentCardTitle = truncateCalendarTitle(

      `${paymentStudentName} - Payment`

    );



    return {



      // Preserve the Payment's MongoDB ID.

      id: payment._id,



      // Preserve the existing event category and green color.

      type: "payment",



      // Preserve the existing student name and Product code title.

      title: `Payment - ${payment.name || "Student not available"}${

        payment.productCode ? ` - ${payment.productCode}` : ""

      }`,



      // STEP 4: Compact title used only by the Calendar event card.

      cardTitle: paymentCardTitle,



      // Use the exact transaction timestamp and calculated 15-minute end.

      start: paymentStart,

      end: paymentEnd,



      // Step 12 changes this from an all-day event to a timed event.

      allDay: false,



      // Preserve the original CRM Payment ID.

      recordId: payment._id,



      // Preserve the existing receipt link.

      recordUrl: `/receiptPrint?paymentId=${encodeURIComponent(payment._id)}`,



      // Preserve the complete original Payment record for the pop-up.

      payment: payment,



    };



  });





  // ==========================================================







  // STEP 7 + STEP 13:







  // TRANSFORM ENROLLMENT RECORDS AND PRESERVE RECORD REFERENCES







  // ==========================================================















  // Each Enrollment has one relevant Calendar date:







  //







  // enrollmentDate







  //







  // map() creates one Calendar event for every Enrollment.







  //







  // Enrollment records contain an embedded Product object.







  //







  // The embedded Product name is used in the event title.







  //







  // STEP 13:







  //







  // Each Enrollment event also retains:







  //







  // - The original MongoDB Enrollment ID.







  // - The frontend route to the Enrollment record.







  // - The complete original Enrollment object.















  const enrollmentEvents = enrollments.map((enrollment) => {



    // --------------------------------------------------------

    // STEP 12: ENROLLMENT START TIME

    // --------------------------------------------------------



    // enrollmentDate is an exact recorded timestamp, so parse it

    // directly instead of converting it to an artificial all-day range.



    const enrollmentStart = new Date(

      enrollment.enrollmentDate

    );



    // --------------------------------------------------------

    // STEP 12: ENROLLMENT END TIME

    // --------------------------------------------------------



    // Add exactly 15 minutes. If this crosses midnight, the event keeps

    // its real calculated end on the following day.



    const enrollmentEnd = new Date(

      enrollmentStart.getTime() +

        TRANSACTION_EVENT_DURATION_MS

    );



    // --------------------------------------------------------

    // ASSORTED CALENDAR FEATURES - STEP 4:

    // CREATE SHORT ENROLLMENT CALENDAR-CARD TITLE

    // --------------------------------------------------------

    // Student-first, no date, and a maximum of 20 characters.

    // The full event.title remains available to the information pop-up.

    const enrollmentStudentName =

      enrollment.customer?.name || "Student not available";

    const enrollmentCardTitle = truncateCalendarTitle(

      `${enrollmentStudentName} - Enrollment`

    );



    return {



      // Preserve the Enrollment's MongoDB ID.

      id: enrollment._id,



      // Preserve the existing event category and yellow color.

      type: "enrollment",



      // Preserve the existing student name and Course name title.

      title: `Enrollment - ${enrollment.customer?.name || "Student not available"}${

        enrollment.product?.name ? ` - ${enrollment.product.name}` : ""

      }`,



      // STEP 4: Compact title used only by the Calendar event card.

      cardTitle: enrollmentCardTitle,



      // Use the exact Enrollment timestamp and calculated 15-minute end.

      start: enrollmentStart,

      end: enrollmentEnd,



      // Step 12 changes this from an all-day event to a timed event.

      allDay: false,



      // Preserve the original CRM Enrollment ID.

      recordId: enrollment._id,



      // Preserve the existing CRM record link.

      recordUrl: `/enrollments/${enrollment._id}`,



      // Preserve the complete original Enrollment record for the pop-up.

      enrollment: enrollment,



    };



  });





  // ==========================================================







  // STEP 9: COMBINE THE THREE EVENT ARRAYS







  // ==========================================================















  // React Big Calendar expects a single events array.







  //







  // The spread operator (...) inserts the contents of each







  // category array into the combined collection.







  //







  // calendarEvents contains:







  //







  // 1. All Course events







  // 2. All Payment events







  // 3. All Enrollment events







  //







  // STEP 13:







  //







  // Each event retains its original MongoDB record ID,







  // frontend record URL and original CRM record object.







  //







  // Combining the arrays does not remove these properties.















  const calendarEvents = [







    ...courseEvents,







    ...paymentEvents,







    ...enrollmentEvents,







  ];

  // ==========================================================
  // ASSORTED CALENDAR FEATURES - STEP 6:
  // DETERMINE EVENTS RELEVANT TO THE DISPLAYED TIME RANGE
  // ==========================================================
  //
  // Step 7 will dynamically remove unused hours from the
  // vertical Calendar time grid.
  //
  // Before those visible hours can be calculated, we first
  // determine which events belong to the currently displayed
  // Day or Week.
  //
  // IMPORTANT:
  // Reuse the Calendar's existing controlled state:
  //
  //     calendarDate
  //     calendarView
  //
  // No parallel navigation state is introduced.
  //
  // DAY:
  //     use events overlapping the selected day.
  //
  // WEEK:
  //     use all events overlapping the displayed week so every
  //     day shares the same eventual vertical time scale.
  //
  // MONTH:
  //     excluded because React Big Calendar's standard Month
  //     view does not use the Day/Week vertical hourly grid.
  //
  // AGENDA:
  //     excluded because Agenda is a list rather than an hourly
  //     vertical time grid.
  //
  // Step 6 only determines the relevant event collection.
  // It does NOT yet apply Calendar min/max values.

  let timeScaleEvents = [];

  // ----------------------------------------------------------
  // DAY VIEW
  // ----------------------------------------------------------
  if (calendarView === Views.DAY) {
    // getCalendarDateRange() returns the selected day's
    // half-open interval:
    //
    //     [start of selected day, start of next day)
    const {
      start: dayStart,
      end: dayEnd,
    } = getCalendarDateRange(
      calendarDate,
      Views.DAY
    );

    // Retain only events overlapping the selected day.
    timeScaleEvents = getEventsInDateRange(
      calendarEvents,
      dayStart,
      dayEnd
    );
  }

  // ----------------------------------------------------------
  // WEEK VIEW
  // ----------------------------------------------------------
  if (calendarView === Views.WEEK) {
    // Determine the complete displayed week using the same
    // Moment-based date-range helper already used elsewhere.
    const {
      start: weekStart,
      end: weekEnd,
    } = getCalendarDateRange(
      calendarDate,
      Views.WEEK
    );

    // Retain every event overlapping the displayed week.
    //
    // Step 7 can then find the earliest start and latest end
    // across the entire week, keeping every day's hour scale
    // consistent.
    timeScaleEvents = getEventsInDateRange(
      calendarEvents,
      weekStart,
      weekEnd
    );
  }
























    // ==========================================================
  // ASSORTED CALENDAR FEATURES - STEP 7:
  // CALCULATE THE REQUIRED CONTINUOUS VISIBLE TIME RANGE
  // ==========================================================
  //
  // Step 6 produced timeScaleEvents for the displayed Day or Week.
  // We now inspect those events to determine:
  //
  //     earliest event start time
  //               |
  //               v
  //     [ continuous visible interval ]
  //               ^
  //               |
  //       latest event end time
  //
  // Empty gaps between events are NOT removed.
  //
  // If the selected Day/Week contains no events, the helper returns
  // the agreed fallback range of 08:00-17:00.
  //
  // Month and Agenda do not use this hourly vertical time scale, but
  // timeScaleEvents is [] in those views, so the fallback values are
  // harmless and are not yet applied to those views in Step 7.
  const dynamicCalendarHours =
    getDynamicCalendarHours(timeScaleEvents);

  // Build local Date objects representing the calculated clock times.
  //
  // React Big Calendar's min/max properties expect Date objects.
  // We deliberately use calendarDate for the date portion; only the
  // hour/minute portion is important to the time-grid scale.
  const dynamicCalendarMin = new Date(calendarDate);
  dynamicCalendarMin.setHours(
    dynamicCalendarHours.startHour,
    dynamicCalendarHours.startMinute,
    0,
    0
  );

  const dynamicCalendarMax = new Date(calendarDate);
  dynamicCalendarMax.setHours(
    dynamicCalendarHours.endHour,
    dynamicCalendarHours.endMinute,
    0,
    0
  );

  // ==========================================================
  // ASSORTED CALENDAR FEATURES - STEP 8:
  // DETERMINE WHETHER DYNAMIC HOURS APPLY TO THIS VIEW
  // ==========================================================
  //
  // React Big Calendar's Day and Week views use the vertical
  // hourly time grid. Month and Agenda do not.
  //
  // Therefore the dynamic min/max values calculated in Step 7
  // are applied only to Day and Week.
  //
  // DAY:
  //     Use the selected day's earliest event start and latest
  //     event end, or 08:00-17:00 when the day has no events.
  //
  // WEEK:
  //     Use the earliest start and latest end found anywhere in
  //     the displayed week. Every day therefore shares one
  //     consistent weekly time scale.
  //
  // MONTH / AGENDA:
  //     Preserve React Big Calendar's normal layouts rather than
  //     treating them as hourly time grids.
  const useDynamicCalendarHours =
    calendarView === Views.DAY ||
    calendarView === Views.WEEK;


// ==========================================================

// STEP 13: PRESERVE RECORD-BASED DYNAMIC TOTALS

// ==========================================================

// The summary cards must continue to describe CRM RECORDS, not the number

// of visual Calendar occurrences generated for those records.

//

// This distinction matters most for Courses. Step 11 expands one Course

// record into one timed Calendar occurrence for every day in its date range.

// For example, one Course running from 1-31 October produces 31 Calendar

// occurrences, but it must still contribute only ONE to the Course total.

//

// The totals remain dynamic and follow the currently displayed Calendar view:

//

// Month  -> displayed month

// Week   -> displayed week

// Day    -> selected day

// Agenda -> displayed Agenda range

//

// A record is included when its Calendar interval overlaps the reporting

// period. The reporting period itself is supplied by getCalendarDateRange().



// ----------------------------------------------------------

// GET THE REPORTING PERIOD FOR THE CURRENT CALENDAR VIEW

// ----------------------------------------------------------

const { start: periodStart, end: periodEnd } = getCalendarDateRange(

  calendarDate,

  calendarView

);



// ----------------------------------------------------------

// CHECK WHETHER AN EVENT OVERLAPS THE REPORTING PERIOD

// ----------------------------------------------------------

// We treat both intervals as half-open ranges:

//

//     Event:  [event.start, event.end)

//     Period: [periodStart, periodEnd)

//

// Two such intervals overlap when:

//

//     event.start < periodEnd

//

// AND

//

//     event.end > periodStart

//

// This is more accurate than checking only event.start. It also preserves

// Step 12 behavior for a 15-minute Payment or Enrollment that begins shortly

// before midnight and finishes after midnight. Such an event genuinely

// overlaps both calendar days.

const occursInSelectedPeriod = (event) => {

  // Ignore malformed Calendar events instead of allowing an invalid Date

  // to affect the summary totals.

  if (

    !(event.start instanceof Date) ||

    !(event.end instanceof Date) ||

    Number.isNaN(event.start.getTime()) ||

    Number.isNaN(event.end.getTime())

  ) {

    return false;

  }



  // Return true when any portion of the event falls inside the reporting

  // period. Boundary-touching intervals do not overlap because the ranges

  // are half-open.

  return (

    event.start < periodEnd &&

    event.end > periodStart

  );

};



// ----------------------------------------------------------

// COURSE RECORD TOTAL

// ----------------------------------------------------------

// courseEvents contains DAILY Course occurrences rather than one event per

// Course record. Counting courseEvents directly would therefore inflate the

// summary card.

//

// Example:

//

//     One Course record

//          |

//          +-- 1 October occurrence

//          +-- 2 October occurrence

//          +-- 3 October occurrence

//          ...

//          +-- 31 October occurrence

//

// Every occurrence retains the original Course MongoDB ID in recordId.

// We therefore:

//

// 1. Keep only Course occurrences overlapping the selected reporting period.

// 2. Extract each occurrence's original Course recordId.

// 3. Put those IDs into a Set.

//

// Set removes duplicate IDs, so 31 occurrences of the same Course still

// contribute exactly ONE to the Course summary card.

//

// A Course spanning more than one reporting period can still count once in

// EACH period because its daily occurrences overlap each relevant period.

const courseIdsInSelectedPeriod = new Set(

  courseEvents

    .filter(occursInSelectedPeriod)

    .map((event) => event.recordId)

);

const totalCourses = courseIdsInSelectedPeriod.size;



// ----------------------------------------------------------

// PAYMENT RECORD TOTAL

// ----------------------------------------------------------

// Step 12 still creates exactly one timed Calendar event for each Payment

// record. Therefore the number of Payment events overlapping the selected

// reporting period is also the number of Payment records for that period.

const totalPayments = paymentEvents.filter(

  occursInSelectedPeriod

).length;



// ----------------------------------------------------------

// ENROLLMENT RECORD TOTAL

// ----------------------------------------------------------

// Step 12 likewise creates exactly one timed Calendar event for each

// Enrollment record. Count the Enrollment events overlapping the selected

// reporting period.

const totalEnrollments = enrollmentEvents.filter(

  occursInSelectedPeriod

).length;



// ----------------------------------------------------------

// COMBINED RECORD TOTAL

// ----------------------------------------------------------

// The combined summary must equal the three category totals.

//

// IMPORTANT: Do NOT calculate this from calendarEvents.length. That array

// contains every daily Course occurrence and would therefore change the

// meaning of the existing summary card.

const totalCalendarEvents =

  totalCourses +

  totalPayments +

  totalEnrollments;



// Display the exact logical period used to calculate the summary cards.







  const periodLabel = calendarView === Views.MONTH







    ? moment(calendarDate).format("MMMM YYYY")







    : calendarView === Views.DAY







    ? moment(calendarDate).format("DD MMMM YYYY")







    : `${moment(periodStart).format("DD MMM YYYY")} – ${moment(periodEnd)







        .subtract(1, "day").format("DD MMM YYYY")}`;















  // ==========================================================







  // STEP 12: DETERMINE THE CALENDAR'S DISPLAY STATE







  // ==========================================================















  // ----------------------------------------------------------







  // CHECK WHETHER ANY API REQUEST FAILED







  // ----------------------------------------------------------















  // Boolean("") returns false.







  //







  // Boolean("Unable to load Payments.") returns true.







  //







  // hasErrors is true when at least one category failed.















  const hasErrors = Boolean(







    errors.courses ||







    errors.payments ||







    errors.enrollments







  );























  // ----------------------------------------------------------







  // CHECK WHETHER ALL REQUESTS SUCCEEDED







  // ----------------------------------------------------------















  // All requests succeeded when there are no error messages.















  const allRequestsSucceeded = !hasErrors;























  // ----------------------------------------------------------







  // CHECK WHETHER THE CALENDAR IS EMPTY







  // ----------------------------------------------------------















  // The Calendar is considered genuinely empty only when:







  //







  // 1. Loading has finished.







  // 2. All three API requests succeeded.







  // 3. No Calendar events were returned in any month.







  //







  // A failed API request must not be mistaken for an







  // empty database collection.















  const isCalendarEmpty =







    !loading &&







    allRequestsSucceeded &&







    calendarEvents.length === 0;























  // ----------------------------------------------------------







  // CHECK WHETHER THE CALENDAR SHOULD BE DISPLAYED







  // ----------------------------------------------------------















  // Display React Big Calendar when:







  //







  // 1. Loading has finished.







  //







  // AND







  //







  // 2. At least one API request succeeded.







  //







  // This allows partial results to remain visible.







  //







  // If all three requests failed, the Calendar is hidden.















  const showCalendar =







    !loading &&







    (







      !errors.courses ||







      !errors.payments ||







      !errors.enrollments







    );























  // ==========================================================







  // STEP 11: EVENT COLOR FUNCTION







  // ==========================================================















  // React Big Calendar calls eventPropGetter() for each event.







  //







  // The function examines the event's type property and







  // returns the appropriate CSS styling.







  //







  // Course     = Blue







  // Payment    = Green







  // Enrollment = Yellow







  //







  // Event titles also identify their category, so color







  // is not the only distinguishing feature.















  const eventPropGetter = (event) => {















    // --------------------------------------------------------







    // COURSE EVENTS — BLUE







    // --------------------------------------------------------















    if (event.type === "course") {















      return {







        style: {







          backgroundColor: "#0066CC",







          color: "#FFFFFF",







          borderColor: "#004C99",







        },







      };















    }























    // --------------------------------------------------------







    // PAYMENT EVENTS — GREEN







    // --------------------------------------------------------















    if (event.type === "payment") {















      return {

        // Used by the CSS below to hide React Big Calendar's automatic
        // Day/Week time label while retaining the 20-character cardTitle.
        className: "calendar-payment-event",







        style: {







          backgroundColor: "#2E7D32",







          color: "#FFFFFF",







          borderColor: "#1B5E20",







        },







      };















    }























    // --------------------------------------------------------







    // ENROLLMENT EVENTS — YELLOW







    // --------------------------------------------------------















    if (event.type === "enrollment") {















      return {

        // Used by the CSS below to hide React Big Calendar's automatic
        // Day/Week time label while retaining the 20-character cardTitle.
        className: "calendar-enrollment-event",







        style: {







          backgroundColor: "#FBC02D",







          color: "#000000",







          borderColor: "#C49000",







        },







      };















    }























    // Unknown event types use the Calendar's default styling.







    return {};















  };























  // ==========================================================







  // DEBUGGING







  // ==========================================================















  // These console messages help verify the data-loading,







  // transformation and counting stages.







  //







  // They execute whenever React renders this component.







  //







  // During initial loading, the arrays will be empty.







  //







  // After the HTTP requests finish, React updates state







  // and renders the component again with the retrieved data.























  // ----------------------------------------------------------







  // RAW DATABASE RECORDS







  // ----------------------------------------------------------















  console.log("Calendar Courses:", courses);















  console.log("Calendar Payments:", payments);















  console.log("Calendar Enrollments:", enrollments);























  // ----------------------------------------------------------







  // TRANSFORMED EVENT ARRAYS







  // ----------------------------------------------------------















  console.log("Calendar Course Events:", courseEvents);

  // ----------------------------------------------------------
  // ASSORTED CALENDAR FEATURES - STEP 9:
  // VERIFY COURSE -> STUDENT DERIVATION
  // ----------------------------------------------------------
  //
  // First inspect the Enrollment grouping itself.
  console.log(
    "Step 9 - Enrollments by Course ID:",
    enrollmentsByCourseId
  );

  // Then inspect the Students attached to each generated Course
  // occurrence. Multiple daily occurrences of the same Course should
  // contain the same Student collection.
  console.log(
    "Step 9 - Course Events with Students:",
    courseEvents.map((event) => ({
      courseId: event.recordId,
      title: event.title,
      start: event.start,
      students: event.students,
    }))
  );















  console.log("Calendar Payment Events:", paymentEvents);















  console.log("Calendar Enrollment Events:", enrollmentEvents);























  // ----------------------------------------------------------







  // COMBINED EVENT ARRAY







  // ----------------------------------------------------------















  console.log("Combined Calendar Events:", calendarEvents);

  // ----------------------------------------------------------
  // ASSORTED CALENDAR FEATURES - STEP 6:
  // EVENTS RELEVANT TO THE DISPLAYED TIME SCALE
  // ----------------------------------------------------------
  //
  // Expected:
  //
  // DAY:
  //     events overlapping the selected day.
  //
  // WEEK:
  //     events overlapping the displayed week.
  //
  // MONTH / AGENDA:
  //     [] because those views do not use this hourly scale.

  console.log(
    "Calendar Time Scale View:",
    calendarView
  );

  console.log(
    "Calendar Time Scale Date:",
    calendarDate
  );

  console.log(
    "Calendar Time Scale Events:",
    timeScaleEvents
  );

  // ----------------------------------------------------------
  // ASSORTED CALENDAR FEATURES - STEP 7:
  // DYNAMIC MINIMUM / MAXIMUM HOUR DEBUGGING
  // ----------------------------------------------------------
  //
  // These logs let us verify the calculation before Step 8 applies
  // the values to React Big Calendar's visible time grid.
  console.log(
    "Dynamic Calendar Hours:",
    dynamicCalendarHours
  );

  console.log(
    "Dynamic Calendar Min:",
    dynamicCalendarMin
  );

  console.log(
    "Dynamic Calendar Max:",
    dynamicCalendarMax
  );

  // ----------------------------------------------------------
  // ASSORTED CALENDAR FEATURES - STEP 8:
  // VERIFY WHETHER THE DYNAMIC TIME GRID IS ACTIVE
  // ----------------------------------------------------------
  //
  // Expected:
  //
  // DAY    -> true
  // WEEK   -> true
  // MONTH  -> false
  // AGENDA -> false
  console.log(
    "Use Dynamic Calendar Hours:",
    useDynamicCalendarHours
  );
























  // ----------------------------------------------------------







  // STEP 13: ORIGINAL CRM RECORD REFERENCES







  // ----------------------------------------------------------















  // Display the original database references associated







  // with each generated Calendar event.







  //







  // This verifies that each event retains:







  //







  // - Its event category.







  // - Its original MongoDB record ID.







  // - Its associated frontend record URL.







  // - Its Calendar title.







  //







  // This debugging code does not modify calendarEvents.







  //







  // It creates a separate array containing only the







  // properties needed to inspect the CRM record references.















  console.log(







    "Calendar CRM Record References:",







    calendarEvents.map((event) => {















      return {















        // Course, Payment or Enrollment.







        type: event.type,















        // Original MongoDB record ID.







        recordId: event.recordId,















        // Frontend route associated with the record.







        recordUrl: event.recordUrl,















        // Calendar event title.







        title: event.title,















      };















    })







  );























  // ----------------------------------------------------------







  // CATEGORY TOTALS







  // ----------------------------------------------------------















  console.log("Total Courses:", totalCourses);















  console.log("Total Payments:", totalPayments);















  console.log("Total Enrollments:", totalEnrollments);















  console.log("Total Calendar Events:", totalCalendarEvents);























  // ----------------------------------------------------------







  // LOADING AND ERROR INFORMATION







  // ----------------------------------------------------------















  console.log("Calendar Loading:", loading);















  console.log("Calendar Errors:", errors);















  console.log("Calendar Empty:", isCalendarEmpty);















  console.log("Show Calendar:", showCalendar);























  // ==========================================================







  // RENDER THE CALENDAR PAGE







  // ==========================================================















  // The return statement describes what React displays.







  //







  // The page contains:







  //







  // 1. Calendar title







  // 2. Four summary cards







  // 3. Loading message







  // 4. Category-specific error messages







  // 5. Empty-state message







  // 6. React Big Calendar







  //







  // When React state changes, the component renders again







  // and the displayed information updates automatically.















  return (















    <div>















      {/* ====================================================







          CALENDAR PAGE TITLE







      \\\\==================================================== */}















      <h1 className="mt-3 mb-4">







        Calendar







      </h1>























      {/* ====================================================







          STEP 12: LOADING STATE







      \\\\==================================================== */}















      {/* Display this message while the three API requests







          are still being processed. */}















      {loading && (















        <div







          className="alert alert-info"







          role="status"







        >







          Loading Calendar data...







        </div>















      )}























      {/* ====================================================







          STEP 12: CATEGORY-SPECIFIC ERROR MESSAGES







      \\\\==================================================== */}















      {/* Each error is displayed independently.







          Successfully retrieved categories remain available. */}























      {/* COURSE ERROR */}















      {errors.courses && (















        <div







          className="alert alert-danger"







          role="alert"







        >







          {errors.courses}







        </div>















      )}























      {/* PAYMENT ERROR */}















      {errors.payments && (















        <div







          className="alert alert-danger"







          role="alert"







        >







          {errors.payments}







        </div>















      )}























      {/* ENROLLMENT ERROR */}















      {errors.enrollments && (















        <div







          className="alert alert-danger"







          role="alert"







        >







          {errors.enrollments}







        </div>















      )}























      {/* ====================================================







          STEP 12: EMPTY CALENDAR STATE







      \\\\==================================================== */}















      {/* Display this message only when:







          1\\\\. Loading has finished.







          2\\\\. All API requests succeeded.







          3\\\\. No Calendar events were returned. */}















      {isCalendarEmpty && (















        <div







          className="alert alert-secondary"







          role="status"







        >







          No Courses, Payments or Enrollments recorded







          for this Calendar.







        </div>















      )}























      {/* ====================================================







          CALENDAR RECORD/EVENT SUMMARY







      \\\\==================================================== */}















      {/* The four summary cards count events within the selected view's







          logical date range (month, week, day or agenda).















          Each category card uses the same color as its







          corresponding Calendar event category.















          A failed category displays "Unavailable" instead







          of zero, because its true database count is unknown.















          The combined total is marked as partial when one







          or more categories could not be retrieved.







      */}















      {!loading && (







         <React.Fragment>







           <h4 className="mb-3">Totals for {periodLabel}</h4>







        <div className="row mb-4">























          {/* ------------------------------------------------







              TOTAL COURSES — BLUE







          \\\\------------------------------------------------ */}















          <div className="col-md-3 mb-3">















            <div







              className="card text-center h-100"







              style={{







                backgroundColor: "#0066CC",







                color: "#FFFFFF",







              }}







            >















              <div className="card-body">















                <h5 className="card-title">







                  Courses







                </h5>















                <h2 className="card-text">















                  {errors.courses







                    ? "Unavailable"







                    : totalCourses}















                </h2>















              </div>















            </div>















          </div>























          {/* ------------------------------------------------







              TOTAL PAYMENTS — GREEN







          \\\\------------------------------------------------ */}















          <div className="col-md-3 mb-3">















            <div







              className="card text-center h-100"







              style={{







                backgroundColor: "#2E7D32",







                color: "#FFFFFF",







              }}







            >















              <div className="card-body">















                <h5 className="card-title">







                  Payments







                </h5>















                <h2 className="card-text">















                  {errors.payments







                    ? "Unavailable"







                    : totalPayments}















                </h2>















              </div>















            </div>















          </div>























          {/* ------------------------------------------------







              TOTAL ENROLLMENTS — YELLOW







          \\\\------------------------------------------------ */}















          <div className="col-md-3 mb-3">















            <div







              className="card text-center h-100"







              style={{







                backgroundColor: "#FBC02D",







                color: "#000000",







              }}







            >















              <div className="card-body">















                <h5 className="card-title">







                  Enrollments







                </h5>















                <h2 className="card-text">















                  {errors.enrollments







                    ? "Unavailable"







                    : totalEnrollments}















                </h2>















              </div>















            </div>















          </div>























          {/* ------------------------------------------------







              TOTAL CALENDAR EVENTS







          \\\\------------------------------------------------ */}















          <div className="col-md-3 mb-3">















            <div className="card text-center h-100 border-secondary">















              <div className="card-body">















                <h5 className="card-title">







                  Total Calendar Events







                </h5>















                <h2 className="card-text">







                  {hasErrors







                    ? "Unavailable"







                    : totalCalendarEvents}







                </h2>















                {/* If one or more categories failed,







                    show the number of events successfully







                    retrieved without presenting it as







                    the complete database total. */}















                {hasErrors && (















                  <p className="card-text">















                    {totalCalendarEvents} loaded















                    <br />















                    <small className="text-muted">







                      Partial results







                    </small>















                  </p>















                )}















              </div>















            </div>















          </div>















        </div>







         </React.Fragment>







      )}























      {/* ====================================================







          STEP 10 + STEP 12:







          DISPLAY DYNAMIC EVENTS IN REACT BIG CALENDAR







      \\\\==================================================== */}















      {/* Display the Calendar only after loading finishes







          and at least one API request has succeeded.















          This preserves successfully retrieved events when







          another category fails.















          If every API request fails, the Calendar is hidden







          and the category-specific error messages remain.







      */}















      {/* ====================================================
          DAY/WEEK PAYMENT + ENROLLMENT TIME-LABEL REMOVAL
      ==================================================== */}

      {/* React Big Calendar places the time in .rbc-event-label and the
          custom CalendarEventCard in .rbc-event-content.

          Hide ONLY the automatic time label for Payment and Enrollment
          events in the Day and Week time-grid views. The custom cardTitle
          remains Student-first and capped at 20 characters.

          Course time labels are unaffected. */}
      <style>{`
        .rbc-time-view .calendar-payment-event .rbc-event-label,
        .rbc-time-view .calendar-enrollment-event .rbc-event-label {
          display: none;
        }

        .rbc-time-view .calendar-payment-event .rbc-event-content,
        .rbc-time-view .calendar-enrollment-event .rbc-event-content {
          width: 100%;
        }
      `}</style>

      {showCalendar && (















        <Calendar















          // Use Moment for date and time localization.







          localizer={localizer}















          // Supply the combined Course, Payment and







          // Enrollment events to React Big Calendar.







          events={calendarEvents}















           // Keep summary cards synchronized with the date selected in







           // Month, Week, Day and Agenda views.







           date={calendarDate}







           onNavigate={handleNavigate}







           // Changing the view recalculates the four summary totals.







           view={calendarView}







           onView={handleViewChange}







           // Keep Agenda's displayed duration in sync with its totals.







           length={AGENDA_LENGTH_DAYS}















          // Identify the event's start and end properties.







          startAccessor="start"







          endAccessor="end"

          // ----------------------------------------------------------
          // ASSORTED CALENDAR FEATURES - STEP 8:
          // APPLY DYNAMIC DAY/WEEK TIME-GRID BOUNDARIES
          // ----------------------------------------------------------
          //
          // Step 6 selected the events relevant to the displayed
          // Day or Week.
          //
          // Step 7 calculated the continuous visible time range:
          //
          //     earliest event start
          //              |
          //              v
          //     [ continuous interval ]
          //              ^
          //              |
          //       latest event end
          //
          // If the selected Day or entire displayed Week contains no
          // events, Step 7 already supplies the 08:00-17:00 fallback.
          //
          // These boundaries are applied only to Day and Week.
          // Month and Agenda receive undefined so their normal layouts
          // remain unaffected.
          min={
            useDynamicCalendarHours
              ? dynamicCalendarMin
              : undefined
          }

          max={
            useDynamicCalendarHours
              ? dynamicCalendarMax
              : undefined
          }















          // Apply category-specific event colors.







          eventPropGetter={eventPropGetter}



          // ASSORTED CALENDAR FEATURES - STEP 4:

          // Payment and Enrollment cards use cardTitle. Course events fall

          // back to their existing event.title.

          components={{
            // Step 10 passes the controlled Calendar view into the
            // custom event renderer so Course cards can use the
            // appropriate Student-name limit.
            event: (props) => (
              <CalendarEventCard
                {...props}
                calendarView={calendarView}
              />
            ),
          }}















          // STEP 14: Open the details pop-up when an event is clicked.







          onSelectEvent={handleSelectEvent}















          // Preserve the existing Calendar display height.







          style={{ height: 750 }}















        />















      )}















      {/* ====================================================







          STEP 14: EVENT INFORMATION POP-UP















          The selected event already contains its original CRM







          record (course, payment or enrollment), so opening this







          window does not require another API request.







      \\\\==================================================== */}















      {selectedEvent && (







        <div







          role="presentation"







          onClick={handleCloseEvent}







          style={{







            position: "fixed",







            inset: 0,







            zIndex: 1050,







            backgroundColor: "rgba(0, 0, 0, 0.65)",







            display: "flex",







            justifyContent: "center",







            alignItems: "center",







            padding: "15px",







          }}







        >







          <div







            className="card shadow-lg"







            role="dialog"







            aria-modal="true"







            aria-label={`${selectedEvent.type} event information`}







            // Clicks inside the dialog must not close the overlay.







            onClick={(event) => event.stopPropagation()}







            style={{
              width: "100%",
              maxWidth: "550px",
              maxHeight: "90vh",

              // STEP 11 ADDITION:
              // Make the popup card a vertical flex container.
              // The header and footer keep their natural height while
              // card-body grows into the remaining available space.
              display: "flex",
              flexDirection: "column",

              // The card itself must not scroll. Scrolling is delegated
              // to card-body so the action buttons remain at the bottom.
              overflow: "hidden",
              borderRadius: "8px",
            }}







          >







            {/* Match the existing category colors used by the calendar. */}







            <div







              className="card-header"







              style={{







                backgroundColor:







                  selectedEvent.type === "course"







                    ? "#0066CC"







                    : selectedEvent.type === "payment"







                    ? "#2E7D32"







                    : "#FBC02D",







                color:







                  selectedEvent.type === "enrollment"







                    ? "#000000"







                    : "#FFFFFF",







                padding: "20px",







              }}







            >







              <h6 className="mb-2">







                {selectedEvent.type.toUpperCase()} EVENT







              </h6>







              <h4 className="mb-0">{selectedEvent.title}</h4>







            </div>















            <div
              className="card-body"
              style={{
                // STEP 11 ADDITION:
                // Fill the space between the popup header and footer.
                flex: "1 1 auto",

                // Required so this flex child can shrink and scroll when
                // the popup reaches its 90vh maximum height.
                minHeight: 0,

                // Scroll only the information/student section.
                overflowY: "auto",
              }}
            >







              <p>







                <strong>Event Date: </strong>







                {selectedEvent.type === "course"

                ? formatEventDate(selectedEvent.start)

                : formatEventDateTime(selectedEvent.start)}







              </p>















              {/* COURSE: Show details from the original Product record. */}







              {selectedEvent.type === "course" && selectedEvent.course && (







                <React.Fragment>







                  <hr />







                  <h5>Course Information</h5>







                  <p><strong>Course Name: </strong>{selectedEvent.course.name}</p>







                  <p><strong>Course Code: </strong>{selectedEvent.course.productCode}</p>







                  <p><strong>Start Date: </strong>{formatEventDate(selectedEvent.course.startDate)}</p>







                  <p><strong>End Date: </strong>{formatEventDate(selectedEvent.course.endDate)}</p>







                <p><strong>Daily Start Time: </strong>{selectedEvent.course.startTime || "Not available"}</p>







                <p><strong>Daily End Time: </strong>{selectedEvent.course.endTime || "Not available"}</p>







                  <p><strong>Instructor: </strong>{selectedEvent.course.instructor?.name || "Not available"}</p>







                  <p><strong>Available Spaces: </strong>{selectedEvent.course.numberInStock ?? "Not available"}</p>







                  <p><strong>Course Fee: </strong>{formatAmount(selectedEvent.course.productPrice)}</p>

                  {/* ============================================
                      ASSORTED CALENDAR FEATURES - STEP 11:
                      EXPANDED COURSE STUDENT LIST
                  ============================================ */}

                  <hr />

                  <h5>Enrolled Students</h5>

                  {/* If the Course has no Students, display a useful
                      empty-state message rather than leaving the
                      section blank. */}
                  {popupStudentDisplay.visibleStudents.length === 0 && (
                    <p className="text-muted mb-0">
                      No Students enrolled.
                    </p>
                  )}

                  {/* Display up to COURSE_POPUP_STUDENT_LIMIT Students.
                      These are the SAME deduplicated Students already
                      attached to the Course event in Step 9 and used
                      by the Course cards in Step 10. */}
                  {popupStudentDisplay.visibleStudents.map((student) => (
                    <div key={String(student._id)}>
                      {student.name}
                    </div>
                  ))}

                  {/* If more Students exist than fit in the pop-up,
                      display the correctly calculated remainder. */}
                  {popupStudentDisplay.remainingCount > 0 && (
                    <div className="mt-2">
                      <strong>
                        + {popupStudentDisplay.remainingCount} more{" "}
                        {popupStudentDisplay.remainingCount === 1
                          ? "student"
                          : "students"}
                      </strong>
                    </div>
                  )}







                </React.Fragment>







              )}















              {/* PAYMENT: Show transaction details from the Payment record. */}







              {selectedEvent.type === "payment" && selectedEvent.payment && (







                <React.Fragment>







                  <hr />







                  <h5>Payment Information</h5>







                  <p><strong>Student: </strong>{selectedEvent.payment.name || "Not available"}</p>







                  <p><strong>Course Code: </strong>{selectedEvent.payment.productCode || "Not available"}</p>







                  <p><strong>Transaction Date: </strong>{formatEventDateTime(selectedEvent.payment.transactionDate)}</p>







                  <p><strong>Gross Amount: </strong>{formatAmount(selectedEvent.payment.grossAmount)}</p>







                  <p><strong>Payment Method: </strong>{selectedEvent.payment.paymentMethod || "Not available"}</p>







                  <p><strong>Payment Status: </strong>{selectedEvent.payment.paymentStatus || "Not available"}</p>







                </React.Fragment>







              )}















              {/* ENROLLMENT: Read embedded student and course details. */}







              {selectedEvent.type === "enrollment" && selectedEvent.enrollment && (







                <React.Fragment>







                  <hr />







                  <h5>Enrollment Information</h5>







                  <p><strong>Student: </strong>{selectedEvent.enrollment.customer?.name || "Not available"}</p>







                  <p><strong>Course: </strong>{selectedEvent.enrollment.product?.name || "Not available"}</p>







                  <p><strong>Enrollment Date: </strong>{formatEventDateTime(selectedEvent.enrollment.enrollmentDate)}</p>







                  <p><strong>Completion Date: </strong>{selectedEvent.enrollment.completionDate ? formatEventDate(selectedEvent.enrollment.completionDate) : "Not completed"}</p>







                  <p><strong>Enrollment Fee: </strong>{formatAmount(selectedEvent.enrollment.enrollmentFee)}</p>







                  <p><strong>Payment Status: </strong>{selectedEvent.enrollment.enrollmentPaid ? "Paid" : "Not Paid"}</p>







                </React.Fragment>







              )}







            </div>















            {/* Use the recordUrl saved in Step 13 for navigation. */}







            {/* ====================================================
                ASSORTED CALENDAR FEATURES - STEP 11:
                ACTION BUTTONS AFTER ENROLLED STUDENTS
            ==================================================== */}

            {/* This footer is deliberately outside and after card-body.
                Therefore, for a Course popup, the visible order is:

                1. Course Information
                2. Enrolled Students
                3. Close and View CRM Record buttons

                Payment and Enrollment popups retain the same footer layout.
                The existing recordUrl is reused for CRM navigation. */}

            <div
              className="card-footer text-right"
              style={{
                // STEP 11 ADDITION:
                // Keep the buttons at their natural height at the bottom
                // while the card-body above them handles scrolling.
                flexShrink: 0,
              }}
            >







              <button







                type="button"







                className="btn btn-secondary mr-2"







                onClick={handleCloseEvent}







              >







                Close







              </button>







              <a







                href={selectedEvent.recordUrl}







                target="_blank"







                rel="noopener noreferrer"







                className="btn btn-primary"







                onClick={handleCloseEvent}







              >







                {selectedEvent.type === "payment"







                  ? "View Payment Receipt"







                  : "View CRM Record"}







              </a>







            </div>







          </div>







        </div>







      )}















    </div>















  );















};























// ============================================================







// EXPORT THE CALENDAR COMPONENT







// ============================================================















// Allows App.js to import MyCalendar and render it through







// the application's /calendar route.















export default MyCalendar;
