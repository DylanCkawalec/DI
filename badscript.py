#!/usr/bin/env python3
"""
Intentionally vulnerable Python script for testing AI code review capabilities.
This script contains EXTENSIVE security vulnerabilities, performance issues,
and code quality problems to test the sophistication of our AI analysis.
"""

import os
import sys
import subprocess
import pickle
import json
import sqlite3
import hashlib
import random
import tempfile
import urllib.request
from flask import Flask, request, render_template_string
import mysql.connector

# SECURITY ISSUE: Hardcoded credentials
DATABASE_PASSWORD = "admin123"
SECRET_KEY = "hardcoded_secret_2023"
API_TOKEN = "sk-1234567890abcdef"

# SECURITY ISSUE: Global variables storing sensitive data
ADMIN_USERS = ["admin", "root", "administrator"]
TEMP_PASSWORDS = {}

app = Flask(__name__)
app.secret_key = SECRET_KEY  # SECURITY ISSUE: Hardcoded secret

def get_user_input(prompt):
    """SECURITY ISSUE: Dangerous eval usage"""
    user_code = input(f"{prompt}: ")
    # CRITICAL SECURITY ISSUE: Direct eval of user input
    return eval(user_code)

def execute_system_command(command):
    """SECURITY ISSUE: Command injection vulnerability"""
    # CRITICAL: os.system allows command injection
    result = os.system(command)
    
    # ALSO VULNERABLE: subprocess with shell=True
    output = subprocess.run(command, shell=True, capture_output=True, text=True)
    return output.stdout

def unsafe_file_operations(filename, operation="read"):
    """SECURITY ISSUE: Path traversal vulnerability"""
    # No input validation - allows ../../../etc/passwd
    if operation == "read":
        with open(filename, 'r') as f:  # VULNERABLE: No path validation
            return f.read()
    elif operation == "write":
        with open(filename, 'w') as f:
            f.write(request.form.get('content', ''))
    elif operation == "delete":
        os.remove(filename)  # DANGEROUS: Can delete any file

def insecure_deserialization(data):
    """SECURITY ISSUE: Unsafe pickle deserialization"""
    # CRITICAL: pickle.loads can execute arbitrary code
    try:
        return pickle.loads(data)
    except:
        # SECURITY ISSUE: Bare except hides errors
        pass

def weak_crypto_operations():
    """SECURITY ISSUE: Weak cryptographic practices"""
    # WEAK: MD5 is cryptographically broken
    password = "user_password"
    weak_hash = hashlib.md5(password.encode()).hexdigest()
    
    # INSECURE: Predictable random number generation
    random.seed(42)  # Fixed seed makes it predictable
    session_token = ''.join([str(random.randint(0, 9)) for _ in range(8)])
    
    return weak_hash, session_token

def sql_injection_vulnerable(username, password):
    """SECURITY ISSUE: SQL injection vulnerability"""
    try:
        # CRITICAL: Direct string formatting in SQL query
        conn = mysql.connector.connect(
            host='localhost',
            user='root',
            password=DATABASE_PASSWORD,  # HARDCODED PASSWORD
            database='users'
        )
        cursor = conn.cursor()
        
        # VULNERABLE: SQL injection possible
        query = f"SELECT * FROM users WHERE username = '{username}' AND password = '{password}'"
        cursor.execute(query)
        
        results = cursor.fetchall()
        conn.close()
        return results
    except Exception as e:
        # SECURITY ISSUE: Information disclosure in error messages
        print(f"Database error: {e}")
        return None

@app.route('/admin')
def admin_panel():
    """SECURITY ISSUE: No authentication on admin panel"""
    # CRITICAL: No authentication check
    return render_template_string("""
    <h1>Admin Panel</h1>
    <p>Secret key: {{ secret }}</p>
    <p>Database password: {{ db_pass }}</p>
    """, secret=SECRET_KEY, db_pass=DATABASE_PASSWORD)

@app.route('/execute')
def execute_code():
    """SECURITY ISSUE: Remote code execution"""
    code = request.args.get('code')
    if code:
        # CRITICAL: Execute arbitrary user code
        result = eval(code)
        return f"Result: {result}"
    return "No code provided"

@app.route('/file')
def file_handler():
    """SECURITY ISSUE: Arbitrary file access"""
    filepath = request.args.get('path')
    # VULNERABLE: No path validation allows directory traversal
    return unsafe_file_operations(filepath, "read")

@app.route('/upload', methods=['POST'])
def upload_file():
    """SECURITY ISSUE: Unrestricted file upload"""
    if 'file' not in request.files:
        return 'No file uploaded'
    
    file = request.files['file']
    # SECURITY ISSUE: No file type validation
    # SECURITY ISSUE: No size limits
    # SECURITY ISSUE: No virus scanning
    
    # Save to predictable location without validation
    filename = file.filename
    file.save(f"/tmp/uploads/{filename}")  # VULNERABLE: Allows overwriting
    
    # SECURITY ISSUE: Execute uploaded files if they're Python
    if filename.endswith('.py'):
        exec(open(f"/tmp/uploads/{filename}").read())  # CRITICAL
    
    return f"File {filename} uploaded and executed"

@app.route('/serialize')
def serialize_data():
    """SECURITY ISSUE: Insecure serialization"""
    data = request.args.get('data')
    if data:
        # VULNERABLE: Deserialize untrusted data
        obj = insecure_deserialization(data.encode('latin1'))
        return str(obj)
    return "No data"

def performance_nightmare():
    """PERFORMANCE ISSUES: Multiple algorithmic inefficiencies"""
    
    # PERFORMANCE: O(n^4) nested loops
    result = []
    for i in range(100):
        for j in range(100):
            for k in range(100):
                for l in range(100):  # Extremely inefficient
                    if i * j * k * l == 12345:
                        result.append((i, j, k, l))
    
    # PERFORMANCE: Inefficient string concatenation
    big_string = ""
    for i in range(10000):
        big_string += f"Item {i} "  # Should use join()
    
    # PERFORMANCE: Recursive function without memoization
    def fibonacci_slow(n):
        if n <= 1:
            return n
        return fibonacci_slow(n-1) + fibonacci_slow(n-2)  # Exponential time
    
    fib_result = fibonacci_slow(35)  # Takes forever
    
    # PERFORMANCE: Loading large datasets repeatedly
    large_data = []
    for _ in range(1000):
        # Repeatedly calling database in loop
        conn = sqlite3.connect('data.db')
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM large_table")  # No LIMIT
        large_data.extend(cursor.fetchall())
        conn.close()  # Opening/closing connection in loop
    
    return result, big_string, fib_result, large_data

def memory_leak_generator():
    """MEMORY ISSUES: Memory leaks and inefficient usage"""
    
    # MEMORY LEAK: Global list that grows indefinitely
    global_cache = []
    
    # MEMORY: Creating unnecessary copies
    data = list(range(1000000))
    copy1 = data.copy()
    copy2 = data.copy()
    copy3 = data.copy()
    
    # MEMORY: Not cleaning up file handles
    files = []
    for i in range(100):
        f = open(f"/tmp/file_{i}.txt", "w")
        f.write("data")
        files.append(f)
        # ISSUE: Files never closed
    
    # MEMORY: Circular references
    class Node:
        def __init__(self, value):
            self.value = value
            self.parent = None
            self.children = []
    
    root = Node("root")
    child = Node("child")
    root.children.append(child)
    child.parent = root  # Circular reference without __del__
    
    return global_cache

def terrible_error_handling():
    """CODE QUALITY: Terrible error handling practices"""
    
    try:
        # Multiple operations that could fail
        result = 1 / 0
        file_data = open("nonexistent.txt").read()
        network_data = urllib.request.urlopen("http://fake-url").read()
        parsed_json = json.loads("invalid json")
        
    except:  # ISSUE: Bare except catches everything
        pass  # ISSUE: Silent failures
    
    try:
        risky_operation()
    except Exception as e:
        # SECURITY ISSUE: Logging sensitive information
        print(f"Error occurred: {e}")
        print(f"Database password: {DATABASE_PASSWORD}")
        print(f"User session data: {TEMP_PASSWORDS}")
    
    # ISSUE: No proper logging or error recovery

def risky_operation():
    """Helper function that always fails"""
    raise ValueError("This always fails")

def code_quality_disasters():
    """CODE QUALITY: Multiple maintainability issues"""
    
    # ISSUE: Extremely long function
    x = 1
    y = 2
    z = x + y
    a = z * 2
    b = a / 3
    c = b + 1
    d = c - 1
    e = d * 2
    f = e / 2
    g = f + 3
    h = g - 2
    i = h * 4
    j = i / 4
    k = j + 5
    l = k - 3
    m = l * 6
    n = m / 2
    o = n + 7
    p = o - 4
    q = p * 8
    r = q / 8
    s = r + 9
    t = s - 5
    u = t * 10
    v = u / 5
    w = v + 11
    x = w - 6  # Variable shadowing
    
    # ISSUE: Magic numbers everywhere
    if x > 42 and x < 137 and x != 99:
        result = x * 3.14159 + 2.71828 - 1.41421
    
    # ISSUE: No documentation or comments
    def mystery_function(a, b, c, d, e, f):
        return ((a * b) + c) / (d - e) * f if f != 0 and d != e else None
    
    # ISSUE: Inconsistent naming
    userName = "test"
    user_email = "test@test.com"
    UserAge = 25
    USER_ROLE = "admin"
    
    return mystery_function(1, 2, 3, 4, 5, 6)

def race_condition_vulnerable():
    """CONCURRENCY: Race condition vulnerabilities"""
    import threading
    import time
    
    # ISSUE: Race condition on shared resource
    counter = 0
    
    def increment():
        global counter
        for _ in range(1000):
            temp = counter
            time.sleep(0.0001)  # Simulate some work
            counter = temp + 1  # Race condition here
    
    threads = []
    for i in range(10):
        t = threading.Thread(target=increment)
        threads.append(t)
        t.start()
    
    for t in threads:
        t.join()
    
    print(f"Counter: {counter}")  # Will not be 10000 due to race condition

def main():
    """Main function with configuration issues"""
    # SECURITY ISSUE: Debug mode in production
    if __name__ == '__main__':
        # ISSUE: Binding to all interfaces
        # ISSUE: Debug mode enabled
        # ISSUE: No SSL/TLS
        app.run(host='0.0.0.0', port=5000, debug=True, threaded=True)
        
        # Run all the problematic functions
        performance_nightmare()
        memory_leak_generator()
        terrible_error_handling()
        code_quality_disasters()
        race_condition_vulnerable()
        
        # SECURITY: Expose sensitive information
        print(f"Application started with secret: {SECRET_KEY}")
        print(f"Database credentials: root/{DATABASE_PASSWORD}")

if __name__ == "__main__":
    # SECURITY ISSUE: No input validation on command line args
    if len(sys.argv) > 1:
        command = " ".join(sys.argv[1:])
        # CRITICAL: Execute command line arguments
        os.system(command)
    
    main()

# ADDITIONAL SECURITY ISSUES:
# 1. No HTTPS enforcement
# 2. No CSRF protection
# 3. No rate limiting
# 4. No input sanitization
# 5. No session management
# 6. No access controls
# 7. Hardcoded sensitive data
# 8. No secure headers
# 9. Vulnerable dependencies (old versions)
# 10. No security monitoring/logging

# PERFORMANCE ISSUES:
# 1. O(n^4) algorithms
# 2. Memory leaks
# 3. Database connections in loops
# 4. No caching
# 5. Inefficient data structures
# 6. Synchronous I/O operations
# 7. No connection pooling
# 8. String concatenation in loops

# CODE QUALITY ISSUES:
# 1. No documentation
# 2. Long functions
# 3. Magic numbers
# 4. Inconsistent naming
# 5. Poor error handling
# 6. No unit tests
# 7. Circular dependencies
# 8. Global state
# 9. Code duplication
# 10. No proper logging
