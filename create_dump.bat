@echo off
"C:\Program Files\MongoDB\Tools\100\bin\mongodump.exe" --host localhost --port 27017 --db saptmarkets --out ./mongodb_dump
pause 