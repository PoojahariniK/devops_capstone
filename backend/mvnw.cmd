@REM ----------------------------------------------------------------------------
@REM Maven Wrapper Script for Windows
@REM ----------------------------------------------------------------------------
@echo off
setlocal

set MAVEN_CACHED=C:\Users\POOJAHARINI\.m2\wrapper\dists\apache-maven-3.9.11-bin\6mqf5t809d9geo83kj4ttckcbc\apache-maven-3.9.11\bin\mvn.cmd

if exist "%MAVEN_CACHED%" (
    call "%MAVEN_CACHED%" %*
) else (
    call mvn %*
)

