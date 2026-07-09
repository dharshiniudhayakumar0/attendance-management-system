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
Write-Host "#       USER API TESTS                        #" -ForegroundColor Green
Write-Host "###############################################" -ForegroundColor Green

# 1. Get all users
Test-API "Get All Users" "GET" "$base/users"

# 2. Login verification (Success)
Test-API "Login Verification (Success)" "POST" "$base/users/login" '{"username":"admin","password":"admin123"}'

# 3. Login verification (Failure)
Test-API "Login Verification (Failure)" "POST" "$base/users/login" '{"username":"admin","password":"wrongpassword"}'

# 4. Create a new user
Test-API "Create New User" "POST" "$base/users" '{"username":"new_user","password":"newpassword","role":"employee"}'

# 5. Get user by ID
Test-API "Get User by ID 6" "GET" "$base/users/6"


Write-Host "`n###############################################" -ForegroundColor Green
Write-Host "#       EMPLOYEE API TESTS                    #" -ForegroundColor Green
Write-Host "###############################################" -ForegroundColor Green

# 6. Get all employees
Test-API "Get All Employees" "GET" "$base/employees"

# 7. Get single employee (Rahul Sharma, ID 1)
Test-API "Get Employee ID 1" "GET" "$base/employees/1"

# 8. Create new employee
Test-API "Create Employee" "POST" "$base/employees" '{"employee_name":"Rohit Varma","email":"rohit.varma@company.com","mobile":"9876543220","department":"Marketing","designation":"Associate"}'

# 9. Update employee (Rohit Varma, ID 11)
Test-API "Update Employee" "PUT" "$base/employees/11" '{"designation":"Senior Associate","status":"Active"}'


Write-Host "`n###############################################" -ForegroundColor Green
Write-Host "#       ATTENDANCE API TESTS                  #" -ForegroundColor Green
Write-Host "###############################################" -ForegroundColor Green

# 10. Get all attendance
Test-API "Get All Attendance" "GET" "$base/attendance"

# 11. Filter attendance by department 'Engineering'
Test-API "Filter by Department (Engineering)" "GET" "$base/attendance?department=Engineering"

# 12. Filter attendance by date '2026-07-09'
Test-API "Filter by Date (2026-07-09)" "GET" "$base/attendance?date=2026-07-09"

# 13. Mark attendance for employee 11 (Rohit) for today
Test-API "Mark Attendance for Rohit (ID 11)" "POST" "$base/attendance" '{"employee_id":11,"attendance_date":"2026-07-09","attendance_status":"Present","check_in_time":"09:00:00","check_out_time":"18:00:00"}'

# 14. Report stats for Rahul Sharma (ID 1)
Test-API "Report stats for Rahul Sharma (ID 1)" "GET" "$base/attendance/report?employee_id=1"

# 15. Delete employee 11 (Rohit) and verify cascade
Test-API "Delete Employee 11 (Rohit)" "DELETE" "$base/employees/11"

# 16. Verify cascade by filtering attendance for employee 11
Test-API "Verify Attendance of Rohit is Deleted" "GET" "$base/attendance?employee_id=11"
