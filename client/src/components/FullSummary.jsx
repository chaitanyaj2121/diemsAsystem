import React, { useState, useEffect, useMemo } from "react"
import {
  User,
  Calendar,
  BookOpen,
  Users,
  Download,
  Filter,
  Loader,
  Plus,
  Info,
} from "lucide-react"
import { db } from "../firebase/config"
import { collection, query, where, getDocs } from "firebase/firestore"

const FullSubjectPracticalSummary = ({
  teacherId,
  year,
  department,
  subjectsTaught = [],
  userRole = "hod",
  currentUserId = null,
}) => {
  const [selectedSubject, setSelectedSubject] = useState("")
  const [selectedYear, setSelectedYear] = useState(year || "All Years")
  const [selectedBatch, setSelectedBatch] = useState("All Batches")
  const [attendanceThreshold, setAttendanceThreshold] = useState(75)
  const [allStudents, setAllStudents] = useState([])
  const [allAttendanceRecords, setAllAttendanceRecords] = useState([])
  const [extraAttendanceRecords, setExtraAttendanceRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")

  const availableSubjects = subjectsTaught || []

  const getAvailableYears = () => {
    if (userRole === "hod") {
      const yearsFromStudents = [
        ...new Set(allStudents.map((student) => student.year)),
      ]
        .filter((year) => year)
        .sort()
      return yearsFromStudents
    } else {
      return [
        ...new Set(availableSubjects.map((subject) => subject.yearTaught)),
      ]
        .filter((y) => y !== "")
        .sort()
    }
  }

  const availableYears = getAvailableYears()
  const yearOptions = ["All Years", ...availableYears]

  const getFilteredSubjects = () => {
    if (userRole === "hod") {
      if (selectedYear === "All Years") {
        return [
          ...new Set(allAttendanceRecords.map((record) => record.subjectName)),
        ]
          .filter(Boolean)
          .sort()
      } else {
        return [
          ...new Set(
            allAttendanceRecords
              .filter((record) => record.year === selectedYear)
              .map((record) => record.subjectName)
          ),
        ]
          .filter(Boolean)
          .sort()
      }
    } else {
      if (selectedYear === "All Years") {
        return availableSubjects
      }
      return availableSubjects.filter(
        (subject) => subject.yearTaught === selectedYear
      )
    }
  }

  const availableBatches = useMemo(() => {
    if (selectedSubject && selectedYear !== "All Years") {
      const currentSubject = availableSubjects.find(
        (subject) =>
          subject.subjectName === selectedSubject &&
          subject.yearTaught === selectedYear
      )
      if (
        currentSubject &&
        currentSubject.hasPractical &&
        currentSubject.practicalBatches
      ) {
        const batches = currentSubject.practicalBatches.map((batch) => {
          const parts = batch.split(" - ")
          if (parts.length === 2 && parts[1].startsWith("Batch ")) {
            return parts[1].split(" ")[1]
          }
          return batch
        })
        return ["All Batches", ...new Set(batches)].sort()
      }
    }
    return ["All Batches"]
  }, [selectedSubject, selectedYear, availableSubjects])

  const getUniqueSubjects = () => {
    const subjectSet = new Set()
    if (selectedYear !== "All Years") {
      allAttendanceRecords.forEach((record) => {
        if (record.year === selectedYear && record.subjectName) {
          subjectSet.add(record.subjectName)
        }
      })
      extraAttendanceRecords.forEach((record) => {
        if (record.year === selectedYear && record.subjectName) {
          subjectSet.add(record.subjectName)
        }
      })
    } else {
      allAttendanceRecords.forEach((record) => {
        if (record.subjectName) {
          subjectSet.add(record.subjectName)
        }
      })
      extraAttendanceRecords.forEach((record) => {
        if (record.subjectName) {
          subjectSet.add(record.subjectName)
        }
      })
    }
    return Array.from(subjectSet).sort()
  }

  // Check if a subject has practical sessions
  const subjectHasPractical = (subjectName) => {
    return allAttendanceRecords.some(
      (record) =>
        record.subjectName === subjectName && record.sessionType === "practical"
    )
  }

  useEffect(() => {
    if (year) {
      setSelectedYear(year)
    } else {
      setSelectedYear("All Years")
    }
  }, [year])

  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true)
      setError("")
      setMessage("")

      try {
        let studentsQueryRef = collection(db, "students")
        let studentWhereClauses = [where("department", "==", department)]

        if (selectedYear && selectedYear !== "All Years") {
          studentWhereClauses.push(where("year", "==", selectedYear))
        }
        if (selectedBatch && selectedBatch !== "All Batches") {
          studentWhereClauses.push(where("batch", "==", selectedBatch))
        }

        const studentsQuery = query(studentsQueryRef, ...studentWhereClauses)
        const studentsSnapshot = await getDocs(studentsQuery)
        const fetchedStudents = studentsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        setAllStudents(fetchedStudents)

        let attendanceQueryRef = collection(db, "attendance")
        let attendanceWhereClauses = [where("department", "==", department)]

        if (selectedYear && selectedYear !== "All Years") {
          attendanceWhereClauses.push(where("year", "==", selectedYear))
        }
        if (selectedSubject && selectedSubject !== "All Subjects") {
          attendanceWhereClauses.push(
            where("subjectName", "==", selectedSubject)
          )
        }
        if (selectedBatch && selectedBatch !== "All Batches") {
          attendanceWhereClauses.push(where("batch", "==", selectedBatch))
        }

        const attendanceQuery = query(
          attendanceQueryRef,
          ...attendanceWhereClauses
        )
        const attendanceSnapshot = await getDocs(attendanceQuery)
        const fetchedAttendance = attendanceSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        setAllAttendanceRecords(fetchedAttendance)

        let extraAttendanceQueryRef = collection(db, "extraAttendance")
        let extraAttendanceWhereClauses = [
          where("department", "==", department),
        ]

        if (selectedYear && selectedYear !== "All Years") {
          extraAttendanceWhereClauses.push(where("year", "==", selectedYear))
        }
        if (selectedSubject && selectedSubject !== "All Subjects") {
          extraAttendanceWhereClauses.push(
            where("subjectName", "==", selectedSubject)
          )
        }

        const extraAttendanceQuery = query(
          extraAttendanceQueryRef,
          ...extraAttendanceWhereClauses
        )
        const extraAttendanceSnapshot = await getDocs(extraAttendanceQuery)
        const fetchedExtraAttendance = extraAttendanceSnapshot.docs.map(
          (doc) => ({
            id: doc.id,
            ...doc.data(),
          })
        )
        setExtraAttendanceRecords(fetchedExtraAttendance)

        setMessage("Data loaded successfully.")
      } catch (err) {
        console.error("Error fetching data:", err)
        setError("Failed to load attendance data. Please try again.")
      } finally {
        setLoading(false)
      }
    }

    if (department) {
      fetchAllData()
    } else {
      setError("Department data is missing. Cannot load summary.")
      setLoading(false)
    }
  }, [department, selectedYear, selectedSubject, selectedBatch])

  const attendanceStats = useMemo(() => {
    const stats = {}
    const subjectList = getUniqueSubjects()

    allStudents.forEach((student) => {
      stats[student.id] = {
        student: student,
        regularTotalSessions: 0,
        regularAttendedSessions: 0,
        totalSessions: 0,
        attendedSessions: 0,
        extraSessionsAdded: 0,
        subjectWise: {},
      }

      subjectList.forEach((subject) => {
        stats[student.id].subjectWise[subject] = {
          lecture: {
            regularTotal: 0,
            regularAttended: 0,
            total: 0,
            attended: 0,
          },
          practical: {
            regularTotal: 0,
            regularAttended: 0,
            total: 0,
            attended: 0,
          },
          regularTotalSessions: 0,
          regularAttendedSessions: 0,
          totalSessions: 0,
          attendedSessions: 0,
        }
      })
    })

    allAttendanceRecords.forEach((record) => {
      const {
        subjectName,
        sessionType,
        attendanceData,
        department: recordDept,
        year: recordYear,
        batch: recordBatch,
        sessionsCount = sessionType === "practical" ? 2 : 1,
      } = record

      if (selectedYear !== "All Years" && recordYear !== selectedYear) {
        return
      }
      if (
        selectedSubject &&
        selectedSubject !== "All Subjects" &&
        subjectName !== selectedSubject
      ) {
        return
      }
      if (
        sessionType === "practical" &&
        selectedBatch !== "All Batches" &&
        recordBatch !== selectedBatch
      ) {
        return
      }

      attendanceData?.forEach((attendance) => {
        const { studentId, isPresent } = attendance

        if (stats[studentId]) {
          const studentStats = stats[studentId]
          const subjectStats = studentStats.subjectWise[subjectName]

          if (subjectStats) {
            const studentActualBatch = studentStats.student.batch || "N/A"
            const recordActualBatch = recordBatch || "N/A"

            if (
              studentStats.student.year === recordYear &&
              (sessionType === "lecture" ||
                recordActualBatch === studentActualBatch)
            ) {
              subjectStats.regularTotalSessions += sessionsCount
              subjectStats.totalSessions += sessionsCount
              subjectStats[sessionType].regularTotal += sessionsCount
              subjectStats[sessionType].total += sessionsCount

              if (isPresent) {
                subjectStats.regularAttendedSessions += sessionsCount
                subjectStats.attendedSessions += sessionsCount
                subjectStats[sessionType].regularAttended += sessionsCount
                subjectStats[sessionType].attended += sessionsCount
              }

              studentStats.regularTotalSessions += sessionsCount
              studentStats.totalSessions += sessionsCount
              if (isPresent) {
                studentStats.regularAttendedSessions += sessionsCount
                studentStats.attendedSessions += sessionsCount
              }
            }
          }
        }
      })
    })

    extraAttendanceRecords.forEach((extraRecord) => {
      const {
        studentId,
        subjectName,
        extraSessions: numExtraSessions,
        year: recordYear,
        sessionType: extraSessionType = "lecture",
        type,
      } = extraRecord

      if (selectedYear !== "All Years" && recordYear !== selectedYear) {
        return
      }
      if (selectedSubject && selectedSubject !== "All Subjects") {
        if (
          type === "extra_attendance_subject" &&
          subjectName !== selectedSubject
        ) {
          return
        }
      }

      if (stats[studentId]) {
        const studentStats = stats[studentId]
        studentStats.extraSessionsAdded += numExtraSessions
        studentStats.attendedSessions += numExtraSessions

        if (
          subjectName &&
          studentStats.subjectWise[subjectName] &&
          type === "extra_attendance_subject"
        ) {
          const subjectStats = studentStats.subjectWise[subjectName]
          subjectStats.attendedSessions += numExtraSessions

          if (subjectStats[extraSessionType]) {
            subjectStats[extraSessionType].attended += numExtraSessions
          }
        }
      }
    })

    return { stats, subjects: subjectList }
  }, [
    allStudents,
    allAttendanceRecords,
    extraAttendanceRecords,
    selectedYear,
    selectedSubject,
    selectedBatch,
  ])

  const getAttendancePercentage = (attended, total) => {
    if (total === 0) return 0
    return Math.round((attended / total) * 100)
  }

  const getStatusColor = (percentage) => {
    if (percentage >= attendanceThreshold) return "text-green-600 bg-green-50"
    if (percentage >= 60) return "text-yellow-600 bg-yellow-50"
    return "text-red-600 bg-red-50"
  }

  const getFilteredStudents = () => {
    return allStudents.filter((student) => {
      const studentStats = attendanceStats.stats[student.id]
      let hasRelevantAttendanceData = false
      if (selectedSubject && selectedSubject !== "All Subjects") {
        hasRelevantAttendanceData =
          studentStats &&
          studentStats.subjectWise[selectedSubject] &&
          (studentStats.subjectWise[selectedSubject].regularTotalSessions > 0 ||
            studentStats.subjectWise[selectedSubject].attendedSessions > 0)
      } else {
        hasRelevantAttendanceData =
          studentStats &&
          (studentStats.regularTotalSessions > 0 ||
            studentStats.attendedSessions > 0)
      }

      let matchesYearFilter = true
      if (selectedYear !== "All Years") {
        matchesYearFilter = student.year === selectedYear
      }

      let matchesBatchFilter = true
      if (selectedBatch !== "All Batches") {
        matchesBatchFilter = student.batch === selectedBatch
      }

      return (
        hasRelevantAttendanceData && matchesYearFilter && matchesBatchFilter
      )
    })
  }

  const filteredStudents = getFilteredStudents()

  const exportToCSV = () => {
    if (filteredStudents.length === 0) {
      alert("No data to export.")
      return
    }

    const headers = [
      "Roll No.",
      "Name of Student",
      "Year",
      "Batch",
      ...attendanceStats.subjects.flatMap((subject) => {
        const hasPractical = subjectHasPractical(subject)
        return hasPractical
          ? [
              `${subject} (L Attended)`,
              `${subject} (L Total)`,
              `${subject} (P Attended)`,
              `${subject} (P Total)`,
            ]
          : [`${subject} (L Attended)`, `${subject} (L Total)`]
      }),
      "Overall Attended Sessions",
      "Overall Regular Total Sessions",
      "Overall Extra Sessions Added",
      "Overall Attendance %",
    ]

    const rows = filteredStudents.map((student) => {
      const studentStats = attendanceStats.stats[student.id]
      const rowData = [
        student.rollNo,
        student.name,
        student.year || "N/A",
        student.batch || "N/A",
      ]

      attendanceStats.subjects.forEach((subject) => {
        const subjectStats = studentStats.subjectWise[subject]
        const hasPractical = subjectHasPractical(subject)

        if (subjectStats) {
          rowData.push(subjectStats.lecture.attended)
          rowData.push(subjectStats.lecture.regularTotal)
          if (hasPractical) {
            rowData.push(subjectStats.practical.attended)
            rowData.push(subjectStats.practical.regularTotal)
          }
        } else {
          rowData.push("", "")
          if (hasPractical) {
            rowData.push("", "")
          }
        }
      })

      rowData.push(studentStats.attendedSessions)
      rowData.push(studentStats.regularTotalSessions)
      rowData.push(studentStats.extraSessionsAdded)
      rowData.push(
        getAttendancePercentage(
          studentStats.attendedSessions,
          studentStats.regularTotalSessions
        )
      )
      return rowData
    })

    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob)
      link.setAttribute("href", url)
      link.setAttribute(
        "download",
        `attendance_summary_${selectedYear}${
          selectedSubject ? `_${selectedSubject}` : ""
        }${selectedBatch !== "All Batches" ? `_${selectedBatch}` : ""}_${
          new Date().toISOString().split("T")[0]
        }.csv`
      )
      link.style.visibility = "hidden"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading attendance data...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="text-red-700">{error}</div>
      </div>
    )
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-lg shadow-sm">
        <div className="border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <BookOpen className="h-6 w-6 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">
                Full Subject-wise & Practical-wise Summary
                {selectedYear !== "All Years" && (
                  <span className="text-lg font-normal text-gray-600 ml-2">
                    ({selectedYear})
                  </span>
                )}
              </h1>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={exportToCSV}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Download className="h-4 w-4" />
                <span>Export to CSV</span>
              </button>
            </div>
          </div>
        </div>

        {extraAttendanceRecords.length > 0 && (
          <div className="px-6 py-3 bg-green-50 border-b border-green-200">
            <div className="flex items-center space-x-2 text-green-700">
              <Info className="h-4 w-4" />
              <span className="text-sm">
                Extra attendance records are included in the calculations,
                increasing attended sessions but not total sessions. Total extra
                sessions added:{" "}
                <span className="font-semibold">
                  {extraAttendanceRecords.reduce(
                    (sum, record) => sum + record.extraSessions,
                    0
                  )}
                </span>
              </span>
            </div>
          </div>
        )}

        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Year
              </label>
              <select
                value={selectedYear}
                onChange={(e) => {
                  setSelectedYear(e.target.value)
                  setSelectedSubject("")
                  setSelectedBatch("All Batches")
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {yearOptions.map((yearOption, index) => (
                  <option key={index} value={yearOption}>
                    {yearOption === "" ? "All Years" : yearOption}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subject
              </label>
              <select
                value={selectedSubject}
                onChange={(e) => {
                  setSelectedSubject(e.target.value)
                  setSelectedBatch("All Batches")
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Subjects</option>
                {userRole === "hod"
                  ? getFilteredSubjects().map((subject, index) => (
                      <option key={index} value={subject}>
                        {subject}
                      </option>
                    ))
                  : getFilteredSubjects().map((subject, index) => (
                      <option key={index} value={subject.subjectName}>
                        {subject.subjectName}
                      </option>
                    ))}
              </select>
            </div>
            {selectedSubject && selectedYear !== "All Years" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Batch
                </label>
                <select
                  value={selectedBatch}
                  onChange={(e) => setSelectedBatch(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {availableBatches.map((batchOption, index) => (
                    <option key={index} value={batchOption}>
                      {batchOption}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Defaulter Threshold (%)
              </label>
              <input
                type="number"
                value={attendanceThreshold}
                onChange={(e) =>
                  setAttendanceThreshold(
                    Math.max(0, Math.min(100, Number(e.target.value)))
                  )
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="0"
                max="100"
              />
            </div>
          </div>
        </div>

        {message && (
          <div className="px-6 py-3 bg-blue-50 border-b border-blue-200">
            <div className="text-blue-700 text-sm">{message}</div>
          </div>
        )}

        {selectedYear === "All Years" ? (
          <div className="p-8 text-center text-gray-500">
            <div className="flex flex-col items-center space-y-3">
              <Calendar className="h-12 w-12 text-gray-400" />
              <div className="text-lg font-medium text-gray-600">
                Please select a specific year to view attendance summary
              </div>
              <div className="text-sm text-gray-500">
                Choose a year from the dropdown above to see student attendance
                data
              </div>
            </div>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <div className="flex flex-col items-center space-y-3">
              <Users className="h-12 w-12 text-gray-400" />
              <div className="text-lg font-medium text-gray-600">
                No attendance data found for {selectedYear}
                {selectedSubject && selectedSubject !== "All Subjects"
                  ? ` for ${selectedSubject}`
                  : ""}
                {selectedBatch && selectedBatch !== "All Batches"
                  ? ` for Batch ${selectedBatch}`
                  : ""}
              </div>
              <div className="text-sm text-gray-500">
                Try adjusting your filters or check if attendance has been
                recorded.
              </div>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="sticky left-0 bg-gray-50 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider z-10"
                  >
                    Roll No.
                  </th>
                  <th
                    scope="col"
                    className="sticky left-16 bg-gray-50 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider z-10"
                  >
                    Name of Student
                  </th>
                  {attendanceStats.subjects.map((subject) => {
                    const hasPractical = subjectHasPractical(subject)
                    return (
                      <th
                        key={subject}
                        scope="col"
                        colSpan={hasPractical ? "4" : "2"}
                        className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-l border-r border-gray-200"
                      >
                        {subject}
                      </th>
                    )
                  })}
                  <th
                    scope="col"
                    colSpan="4"
                    className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-l border-gray-200"
                  >
                    Overall Attendance
                  </th>
                </tr>
                <tr>
                  <th
                    scope="col"
                    className="sticky left-0 bg-gray-50 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider z-10"
                  ></th>
                  <th
                    scope="col"
                    className="sticky left-16 bg-gray-50 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider z-10"
                  ></th>
                  {attendanceStats.subjects.flatMap((subject) => {
                    const hasPractical = subjectHasPractical(subject)
                    const columns = [
                      <th
                        key={`${subject}-L-Attended`}
                        scope="col"
                        className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-l border-gray-200"
                      >
                        L Attended
                      </th>,
                      <th
                        key={`${subject}-L-Total`}
                        scope="col"
                        className={`px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider ${
                          !hasPractical ? "border-r border-gray-200" : ""
                        }`}
                      >
                        L Total
                      </th>,
                    ]

                    if (hasPractical) {
                      columns.push(
                        <th
                          key={`${subject}-P-Attended`}
                          scope="col"
                          className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-l border-gray-200"
                        >
                          P Attended
                        </th>,
                        <th
                          key={`${subject}-P-Total`}
                          scope="col"
                          className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200"
                        >
                          P Total
                        </th>
                      )
                    }

                    return columns
                  })}
                  <th
                    scope="col"
                    className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-l border-gray-200"
                  >
                    Attended
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Total
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Extra
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    %
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredStudents.map((student) => {
                  const studentStats = attendanceStats.stats[student.id]
                  if (!studentStats) return null

                  const overallPercentage = getAttendancePercentage(
                    studentStats.attendedSessions,
                    studentStats.regularTotalSessions
                  )

                  return (
                    <tr key={student.id}>
                      <td className="sticky left-0 bg-white px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 border-r border-gray-200">
                        {student.rollNo}
                      </td>
                      <td className="sticky left-16 bg-white px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200">
                        {student.name}
                      </td>
                      {attendanceStats.subjects.map((subject) => {
                        const subjectStats = studentStats.subjectWise[subject]
                        const hasPractical = subjectHasPractical(subject)

                        return (
                          <React.Fragment key={`${student.id}-${subject}`}>
                            <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500 text-center border-l border-gray-200">
                              {subjectStats?.lecture.attended || 0}
                            </td>
                            <td
                              className={`px-3 py-4 whitespace-nowrap text-sm text-gray-500 text-center ${
                                !hasPractical ? "border-r border-gray-200" : ""
                              }`}
                            >
                              {subjectStats?.lecture.regularTotal || 0}
                            </td>
                            {hasPractical && (
                              <>
                                <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500 text-center border-l border-gray-200">
                                  {subjectStats?.practical.attended || 0}
                                </td>
                                <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500 text-center border-r border-gray-200">
                                  {subjectStats?.practical.regularTotal || 0}
                                </td>
                              </>
                            )}
                          </React.Fragment>
                        )
                      })}
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500 text-center border-l border-gray-200">
                        {studentStats.attendedSessions}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                        {studentStats.regularTotalSessions}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                        {studentStats.extraSessionsAdded}
                      </td>
                      <td
                        className={`px-3 py-4 whitespace-nowrap text-sm font-semibold text-center ${getStatusColor(
                          overallPercentage
                        )}`}
                      >
                        {overallPercentage}%
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default FullSubjectPracticalSummary
