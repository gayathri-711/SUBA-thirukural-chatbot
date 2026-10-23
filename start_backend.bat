@echo off
echo ==========================================================
echo Starting SUBA Backend for Mobile & Web (0.0.0.0:8000)
echo Accessible locally on: http://192.168.0.9:8000/api
echo ==========================================================
set PYTHONIOENCODING=utf-8
cd backend
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
