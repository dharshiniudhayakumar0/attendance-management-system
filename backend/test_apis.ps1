$base = "http://localhost:5000/api"
$headers = @{ "Content-Type" = "application/json" }

function Test-API {
    param([string]$Label, [string]$Method, [string]$Uri, [string]$Body)
    Write-Host "`n========================================" -ForegroundColor Cyan
    Write-Host "TEST: $Label" -ForegroundColor Yellow
    Write-Host "$Method $Uri" -ForegroundColor Gray
    try {
        $params = @{ Uri = $Uri; Method = $Method; Headers = $headers; ContentType = "application/json" }
        if ($Body) { $params.Body = $Body }
        $resp = Invoke-RestMethod @params
        $resp | ConvertTo-Json -Depth 5
    } catch {
        Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
        if ($_.Exception.Response) {
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            $reader.ReadToEnd()
        }
    }
}

Write-Host "`n###############################################" -ForegroundColor Green
Write-Host "#       STUDENT API TESTS                     #" -ForegroundColor Green
Write-Host "###############################################" -ForegroundColor Green

# 1. Create Student 1
Test-API "Create Student 1" "POST" "$base/students" '{"name":"Alice Johnson","roll_number":"CS2024001","email":"alice@example.com","department":"Computer Science","year":2}'

# 2. Create Student 2
Test-API "Create Student 2" "POST" "$base/students" '{"name":"Bob Smith","roll_number":"CS2024002","email":"bob@example.com","department":"Computer Science","year":2}'

# 3. Create Student 3
Test-API "Create Student 3" "POST" "$base/students" '{"name":"Charlie Brown","roll_number":"EC2024001","email":"charlie@example.com","department":"Electronics","year":3}'

# 4. Get all students
Test-API "Get All Students" "GET" "$base/students"

# 5. Get student by ID
Test-API "Get Student by ID (1)" "GET" "$base/students/1"

# 6. Update student
Test-API "Update Student 1" "PUT" "$base/students/1" '{"name":"Alice J. Updated","year":3}'

# 7. Get non-existent student (404)
Test-API "Get Non-Existent Student (404)" "GET" "$base/students/999"

# 8. Create duplicate roll_number (409)
Test-API "Duplicate Roll Number (409)" "POST" "$base/students" '{"name":"Duplicate","roll_number":"CS2024001","email":"dup@example.com","department":"CS","year":1}'

# 9. Missing field (400)
Test-API "Missing Required Field (400)" "POST" "$base/students" '{"name":"No Email","roll_number":"XX001","department":"CS","year":1}'


Write-Host "`n###############################################" -ForegroundColor Green
Write-Host "#       SUBJECT API TESTS                     #" -ForegroundColor Green
Write-Host "###############################################" -ForegroundColor Green

# 10. Create Subject 1
Test-API "Create Subject 1" "POST" "$base/subjects" '{"name":"Data Structures","code":"CS201","department":"Computer Science"}'

# 11. Create Subject 2
Test-API "Create Subject 2" "POST" "$base/subjects" '{"name":"Database Systems","code":"CS301","department":"Computer Science"}'

# 12. Get all subjects
Test-API "Get All Subjects" "GET" "$base/subjects"

# 13. Get subject by ID
Test-API "Get Subject by ID (1)" "GET" "$base/subjects/1"

# 14. Update subject
Test-API "Update Subject 1" "PUT" "$base/subjects/1" '{"name":"Advanced Data Structures"}'

# 15. Duplicate code (409)
Test-API "Duplicate Subject Code (409)" "POST" "$base/subjects" '{"name":"Another","code":"CS201","department":"CS"}'


Write-Host "`n###############################################" -ForegroundColor Green
Write-Host "#       ATTENDANCE API TESTS                  #" -ForegroundColor Green
Write-Host "###############################################" -ForegroundColor Green

# 16. Mark attendance - Student 1, Subject 1, today
Test-API "Mark Attendance (Student 1, Subject 1, Present)" "POST" "$base/attendance" '{"student_id":1,"subject_id":1,"status":"Present","date":"2026-07-09"}'

# 17. Mark attendance - Student 2, Subject 1, today
Test-API "Mark Attendance (Student 2, Subject 1, Absent)" "POST" "$base/attendance" '{"student_id":2,"subject_id":1,"status":"Absent","date":"2026-07-09"}'

# 18. Mark attendance - Student 1, Subject 2, today
Test-API "Mark Attendance (Student 1, Subject 2, Late)" "POST" "$base/attendance" '{"student_id":1,"subject_id":2,"status":"Late","date":"2026-07-09"}'

# 19. Mark attendance - Student 3, Subject 1, today
Test-API "Mark Attendance (Student 3, Subject 1, Present)" "POST" "$base/attendance" '{"student_id":3,"subject_id":1,"status":"Present","date":"2026-07-09"}'

# 20. Mark attendance - previous day
Test-API "Mark Attendance (Student 1, Subject 1, Jul 8)" "POST" "$base/attendance" '{"student_id":1,"subject_id":1,"status":"Present","date":"2026-07-08"}'

# 21. Duplicate attendance (409)
Test-API "Duplicate Attendance (409)" "POST" "$base/attendance" '{"student_id":1,"subject_id":1,"status":"Absent","date":"2026-07-09"}'

# 22. Invalid status (400)
Test-API "Invalid Status (400)" "POST" "$base/attendance" '{"student_id":1,"subject_id":1,"status":"Unknown"}'

# 23. Get all attendance
Test-API "Get All Attendance" "GET" "$base/attendance"

# 24. Filter by student_id
Test-API "Filter Attendance by student_id=1" "GET" "$base/attendance?student_id=1"

# 25. Filter by subject_id
Test-API "Filter Attendance by subject_id=1" "GET" "$base/attendance?subject_id=1"

# 26. Filter by date
Test-API "Filter Attendance by date=2026-07-09" "GET" "$base/attendance?date=2026-07-09"

# 27. Filter by status
Test-API "Filter Attendance by status=Present" "GET" "$base/attendance?status=Present"

# 28. Get single attendance record
Test-API "Get Attendance Record (1)" "GET" "$base/attendance/1"

# 29. Update attendance
Test-API "Update Attendance 2 → Present" "PUT" "$base/attendance/2" '{"status":"Present"}'


Write-Host "`n###############################################" -ForegroundColor Green
Write-Host "#       ATTENDANCE REPORT TESTS               #" -ForegroundColor Green
Write-Host "###############################################" -ForegroundColor Green

# 30. Full report
Test-API "Full Attendance Report" "GET" "$base/attendance/report"

# 31. Report for student 1
Test-API "Report for Student 1" "GET" "$base/attendance/report?student_id=1"

# 32. Report for subject 1
Test-API "Report for Subject 1" "GET" "$base/attendance/report?subject_id=1"

# 33. Report for student 1 + subject 1
Test-API "Report for Student 1 + Subject 1" "GET" "$base/attendance/report?student_id=1&subject_id=1"


Write-Host "`n###############################################" -ForegroundColor Green
Write-Host "#       DELETE TESTS                          #" -ForegroundColor Green
Write-Host "###############################################" -ForegroundColor Green

# 34. Delete attendance record
Test-API "Delete Attendance Record 1" "DELETE" "$base/attendance/1"

# 35. Delete non-existent (404)
Test-API "Delete Non-Existent Attendance (404)" "DELETE" "$base/attendance/999"

# 36. Delete student (cascades attendance)
Test-API "Delete Student 3 (cascade)" "DELETE" "$base/students/3"

# 37. Verify cascade
Test-API "Get All Attendance After Cascade" "GET" "$base/attendance"

# 38. Delete subject
Test-API "Delete Subject 2" "DELETE" "$base/subjects/2"

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "ALL TESTS COMPLETE!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
