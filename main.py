"""
College Dashboard System - FastAPI Backend
File: main.py

Requirements:
    pip install fastapi uvicorn sqlalchemy pymysql python-jose[cryptography] passlib[bcrypt] python-multipart

Run:
    uvicorn main:app --reload --host 0.0.0.0 --port 8000

API Docs:
    http://localhost:8000/docs
"""


# 🔹 Imports
from datetime import datetime, timedelta
from typing import Optional, List
import os
import csv
import io


from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.responses import StreamingResponse
from jose import JWTError, jwt


import time
from pydantic import BaseModel
from sqlalchemy import (
    create_engine, Column, Integer, String, Boolean, DateTime,
    Enum, Text, Float, ForeignKey, Time
)

from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import Session, sessionmaker, relationship

# ─────────────────────────────────────────────
# Configuration
# ─────────────────────────────────────────────
# Database configuration - uses environment variable or defaults
# For MySQL use: mysql+pymysql://root:password@localhost:3306/college_db
# For SQLite use: sqlite:///./college_db.db
# Default to MySQL for this project (using College@8807 as password)
# Note: @ in password must be URL-encoded as %40
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "mysql+pymysql://root:College%408807@localhost:3306/college_db"
)

# SECRET_KEY for JWT token generation - should be a long random string in production
# For development, we use a fixed key. In production, set SECRET_KEY environment variable.
SECRET_KEY = os.getenv("SECRET_KEY", "09f46b4b9e8f2a1d3c5e7f9a0b2d4e6f8a1c3e5f7d9b2a4f6e8d0c2a4e6f8d")

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 8  # 8 hours

# ─────────────────────────────────────────────
# Database Setup
# ─────────────────────────────────────────────
engine = create_engine(DATABASE_URL, echo=False)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Auto-create tables if they don't exist (links models to DB)
Base.metadata.create_all(bind=engine)

# ─────────────────────────────────────────────
# ORM Models
# ─────────────────────────────────────────────
class UserModel(Base):
    __tablename__ = "users"
    id            = Column(Integer, primary_key=True, index=True)
    username      = Column(String(100), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role          = Column(Enum("student", "admin", "exam_dept"), default="student")
    email         = Column(String(150), unique=True)
    is_active     = Column(Boolean, default=True)
    created_at    = Column(DateTime, default=datetime.utcnow)
    updated_at    = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    student = relationship("StudentModel", back_populates="user", uselist=False)


class StudentModel(Base):
    __tablename__ = "students"
    id                = Column(Integer, primary_key=True, index=True)
    user_id           = Column(Integer, ForeignKey("users.id"), nullable=False)
    student_id        = Column(String(20), unique=True, nullable=False)
    full_name         = Column(String(150), nullable=False)
    dob               = Column(DateTime)
    gender            = Column(Enum("Male", "Female", "Other"))
    phone             = Column(String(15))
    address           = Column(Text)
    department        = Column(String(100), nullable=False)
    semester          = Column(Integer, nullable=False)
    academic_year     = Column(String(10))
    enrollment_date   = Column(DateTime)
    profile_photo_url = Column(String(255))
    created_at        = Column(DateTime, default=datetime.utcnow)
    updated_at        = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user    = relationship("UserModel", back_populates="student")
    results = relationship("ResultModel", back_populates="student")


class SubjectModel(Base):
    __tablename__ = "subjects"
    id           = Column(Integer, primary_key=True, index=True)
    subject_code = Column(String(20), unique=True, nullable=False)
    subject_name = Column(String(150), nullable=False)
    department   = Column(String(100), nullable=False)
    semester     = Column(Integer, nullable=False)
    credits      = Column(Integer, default=3)
    created_at   = Column(DateTime, default=datetime.utcnow)


class ResultModel(Base):
    __tablename__ = "results"
    id             = Column(Integer, primary_key=True, index=True)
    student_id     = Column(Integer, ForeignKey("students.id"), nullable=False)
    subject_id     = Column(Integer, ForeignKey("subjects.id"), nullable=False)
    semester       = Column(Integer, nullable=False)
    academic_year  = Column(String(10), nullable=False)
    internal_marks = Column(Float, default=0)
    external_marks = Column(Float, default=0)
    max_internal   = Column(Integer, default=50)
    max_external   = Column(Integer, default=50)
    grade          = Column(String(5))
    status         = Column(Enum("pending", "verified", "published"), default="pending")
    entered_by     = Column(Integer, ForeignKey("users.id"), nullable=True)
    verified_by    = Column(Integer, ForeignKey("users.id"), nullable=True)
    published_at   = Column(DateTime, nullable=True)
    created_at     = Column(DateTime, default=datetime.utcnow)
    updated_at     = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    student = relationship("StudentModel", back_populates="results")
    subject = relationship("SubjectModel")


class NotificationModel(Base):
    __tablename__ = "notifications"
    id                = Column(Integer, primary_key=True, index=True)
    title             = Column(String(255), nullable=False)
    message           = Column(Text, nullable=False)
    type              = Column(Enum("info", "warning", "success", "urgent"), default="info")
    target_role       = Column(Enum("all", "student", "admin", "exam_dept"), default="all")
    target_department = Column(String(100), nullable=True)
    target_semester   = Column(Integer, nullable=True)
    is_active         = Column(Boolean, default=True)
    created_by        = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at        = Column(DateTime, default=datetime.utcnow)
    expires_at        = Column(DateTime, nullable=True)


# (Reverted) system_settings model removed to undo Feature 1 changes



class TimetableEntryModel(Base):
    __tablename__ = "timetable_entries"

    id = Column(Integer, primary_key=True, index=True)
    day = Column(String(15), nullable=False, index=True)
    subject = Column(String(150), nullable=False)
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    faculty_name = Column(String(150), nullable=False)
    classroom = Column(String(50), nullable=False)
    is_published = Column(Boolean, default=False, nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)





# ─────────────────────────────────────────────
# Pydantic Schemas
# ─────────────────────────────────────────────



class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    username: str
    user_id: int

class TokenData(BaseModel):
    username: Optional[str] = None

class UserRegisterRequest(BaseModel):
    username: str
    password: str
    email: Optional[str] = None
    role: str = "student"
    full_name: Optional[str] = None
    student_id: Optional[str] = None
    department: Optional[str] = None
    semester: Optional[int] = None
    academic_year: Optional[str] = None

    # Student profile fields (must be persisted)
    phone: Optional[str] = None
    dob: Optional[datetime] = None
    gender: Optional[str] = None
    address: Optional[str] = None

class UserResponse(BaseModel):
    id: int
    username: str
    role: str
    email: Optional[str]
    is_active: bool
    class Config:
        from_attributes = True

class StudentCreate(BaseModel):
    username: str
    password: str
    email: Optional[str] = None
    full_name: str
    student_id: str
    department: str
    semester: int
    academic_year: Optional[str] = None
    phone: Optional[str] = None
    gender: Optional[str] = None
    address: Optional[str] = None

class MarksEntry(BaseModel):
    student_id: int
    subject_id: int
    semester: int
    academic_year: str
    internal_marks: float
    external_marks: float

class NotificationCreate(BaseModel):
    title: str
    message: str
    type: str = "info"
    target_role: str = "all"
    target_department: Optional[str] = None
    target_semester: Optional[int] = None


class TimetableEntryCreate(BaseModel):
    day: str
    subject: str
    start_time: str  # HH:MM
    end_time: str    # HH:MM
    faculty_name: str
    classroom: str


class TimetableEntryUpdate(BaseModel):
    day: str
    subject: str
    start_time: str  # HH:MM
    end_time: str    # HH:MM
    faculty_name: str
    classroom: str


class TimetablePublishRequest(BaseModel):
    # kept for future extensibility; not required currently
    pass





# ─────────────────────────────────────────────
# Security Utilities
# ─────────────────────────────────────────────

import bcrypt
import hashlib
from datetime import datetime, timedelta
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

# Password hashing/verification
def hash_password(password: str) -> str:
    try:
        password_bytes = password.encode("utf-8")
        salt = bcrypt.gensalt()
        hashed = bcrypt.hashpw(password_bytes, salt)

        # Debug log
        print("Generated Hash:", hashed.decode("utf-8"))

        return hashed.decode("utf-8")

    except Exception as e:
        print("Hashing Error:", str(e))
        raise HTTPException(
            status_code=500,
            detail="Password hashing failed"
        )


def verify_password(plain: str, hashed: str) -> bool:
    try:
        # Validate stored hash
        if not hashed:
            print("Stored password hash is empty")
            return False

        if not hashed.startswith("$2"):
            print("Invalid bcrypt hash format")
            return False

        plain_bytes = plain.encode("utf-8")
        hashed_bytes = hashed.encode("utf-8")

        result = bcrypt.checkpw(plain_bytes, hashed_bytes)

        # Debug log
        print("Password Verify Result:", result)

        return result

    except Exception as e:
        print("Password Verification Error:", str(e))
        return False


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()

    expire = datetime.utcnow() + (
        expires_delta or timedelta(minutes=15)
    )

    to_encode.update({"exp": expire})

    return jwt.encode(
        to_encode,
        SECRET_KEY,
        algorithm=ALGORITHM
    )


def get_db():
    db = SessionLocal()

    try:
        yield db

    finally:
        db.close()


def get_user_by_username(db: Session, username: str) -> Optional[UserModel]:
    return db.query(UserModel).filter(
        UserModel.username == username
    ).first()


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> UserModel:

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

        username = payload.get("sub")

        if username is None:
            raise credentials_exception

    except JWTError:
        raise credentials_exception

    user = get_user_by_username(db, username)

    if user is None or not user.is_active:
        raise credentials_exception

    return user


def require_role(*roles):
    def checker(
        current_user: UserModel = Depends(get_current_user)
    ):

        if current_user.role not in roles:
            raise HTTPException(
                status_code=403,
                detail="Insufficient permissions"
            )

        return current_user

    return checker


def calculate_grade(total: float, max_total: int = 100) -> str:
    pct = (total / max_total) * 100
    if pct >= 90:
        return "O"
    if pct >= 80:
        return "A+"
    if pct >= 70:
        return "A"
    if pct >= 60:
        return "B+"
    if pct >= 50:
        return "B"
    if pct >= 40:
        return "C"
    return "F"
# ─────────────────────────────────────────────
# FastAPI App
# ─────────────────────────────────────────────
app = FastAPI(
    title="College Dashboard API",
    version="1.0.0",
    description="Backend API for the College Dashboard System"
)

# Get allowed origins from environment or use defaults
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:3000").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,  # Configure via ALLOWED_ORIGINS env var for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─────────────────────────────────────────────
# AUTH ROUTES
# ─────────────────────────────────────────────
@app.post("/auth/login", response_model=Token, tags=["Authentication"])
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    user = get_user_by_username(db, form_data.username)
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(status_code=400, detail="Incorrect username or password")
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Account is disabled")

    # NOTE:
    # The frontend sends an extra `role` field, but OAuth2PasswordRequestForm
    # only reliably provides `username` and `password`.
    #
    # Enforcing role based on non-standard fields breaks valid logins.
    # So we only validate username/password and account active status here.




    token = create_access_token(
        data={"sub": user.username, "role": user.role},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
    )
    return {
        "access_token": token,
        "token_type": "bearer",
        "role": user.role,
        "username": user.username,
        "user_id": user.id,
    }



@app.post("/auth/register", response_model=UserResponse, status_code=201, tags=["Authentication"])
def register(payload: UserRegisterRequest, db: Session = Depends(get_db)):
    time_start = time.time()
    print(f"[REGISTER] START - username: {payload.username} role: {payload.role}")
    try:
        if get_user_by_username(db, payload.username):
            raise HTTPException(status_code=400, detail="Username already taken")



        user = UserModel(
            username=payload.username,
            password_hash=hash_password(payload.password),
            role=payload.role,
            email=payload.email,
        )
        db.add(user)
        db.flush()
        if payload.role == "student":
            if not all([payload.full_name, payload.student_id, payload.department, payload.semester]):
                db.rollback()
                raise HTTPException(status_code=422, detail="Student fields are required for student role")

            # Avoid duplicate student_id inserts
            existing_student = (
                db.query(StudentModel)
                .filter(StudentModel.student_id == payload.student_id)
                .first()
            )
            if existing_student:
                raise HTTPException(status_code=400, detail="Student ID already exists")

            student = StudentModel(
                user_id=user.id,
                student_id=payload.student_id,
                full_name=payload.full_name,
                department=payload.department,
                semester=payload.semester,
                academic_year=payload.academic_year,
                phone=payload.phone,
                dob=payload.dob,
                gender=payload.gender,
                address=payload.address,
            )
            db.add(student)
        db.commit()
        db.refresh(user)
        duration = time.time() - time_start
        print(f"[REGISTER] SUCCESS - user_id: {user.id}, duration: {duration:.2f}s")
        return user
    except HTTPException:
        # Preserve existing error codes + messages
        db.rollback()
        duration = time.time() - time_start
        raise
    except Exception as e:
        db.rollback()
        duration = time.time() - time_start
        print(f"[REGISTER] ERROR - '{str(e)}', duration: {duration:.2f}s")
        raise HTTPException(status_code=500, detail=f"Registration error: {str(e)}")



@app.get("/auth/me", response_model=UserResponse, tags=["Authentication"])
def get_me(current_user: UserModel = Depends(get_current_user)):
    return current_user

# ─────────────────────────────────────────────
# STUDENT ROUTES
# ─────────────────────────────────────────────
@app.get("/student/profile", tags=["Student"])
def get_student_profile(current_user: UserModel = Depends(require_role("student")),
                         db: Session = Depends(get_db)):
    student = db.query(StudentModel).filter(StudentModel.user_id == current_user.id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found")
    return {
        "id": student.id,
        "student_id": student.student_id,
        "full_name": student.full_name,
        "email": current_user.email,
        "phone": student.phone,
        "gender": student.gender,
        "dob": student.dob,
        "address": student.address,
        "department": student.department,
        "semester": student.semester,
        "academic_year": student.academic_year,
        "enrollment_date": student.enrollment_date,
        "profile_photo_url": student.profile_photo_url,
    }


@app.get("/student/results", tags=["Student"])
def get_student_results(current_user: UserModel = Depends(require_role("student")),
                         db: Session = Depends(get_db)):
    student = db.query(StudentModel).filter(StudentModel.user_id == current_user.id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found")
    results = (
        db.query(ResultModel, SubjectModel)
        .join(SubjectModel, ResultModel.subject_id == SubjectModel.id)
        .filter(ResultModel.student_id == student.id, ResultModel.status == "published")
        .all()
    )
    return [
        {
            "id": r.id,
            "subject_code": s.subject_code,
            "subject_name": s.subject_name,
            "semester": r.semester,
            "academic_year": r.academic_year,
            "internal_marks": r.internal_marks,
            "external_marks": r.external_marks,
            "total_marks": r.internal_marks + r.external_marks,
            "max_internal": r.max_internal,
            "max_external": r.max_external,
            "grade": r.grade,
            "status": r.status,
        }
        for r, s in results
    ]


@app.get("/student/notifications", tags=["Student"])
def get_student_notifications(current_user: UserModel = Depends(require_role("student")),
                               db: Session = Depends(get_db)):
    student = db.query(StudentModel).filter(StudentModel.user_id == current_user.id).first()
    query = db.query(NotificationModel).filter(
        NotificationModel.is_active == True,
        NotificationModel.target_role.in_(["all", "student"])
    )
    if student:
        query = query.filter(
            (NotificationModel.target_department == None) |
            (NotificationModel.target_department == student.department)
        )
    notifications = query.order_by(NotificationModel.created_at.desc()).limit(20).all()
    return [{"id": n.id, "title": n.title, "message": n.message, "type": n.type, "created_at": n.created_at}
            for n in notifications]

# ─────────────────────────────────────────────
# ADMIN ROUTES
# ─────────────────────────────────────────────




@app.get("/admin/students", tags=["Admin"])
def list_all_students(current_user: UserModel = Depends(require_role("admin")),
                      db: Session = Depends(get_db)):

    students = db.query(StudentModel, UserModel).join(UserModel).all()
    return [
        {
            "id": s.id,
            "student_id": s.student_id,
            "full_name": s.full_name,
            "email": u.email,
            "department": s.department,
            "semester": s.semester,
            "academic_year": s.academic_year,
            "is_active": u.is_active,
        }
        for s, u in students
    ]


@app.get("/admin/students/download", tags=["Admin"])
def download_student_list(current_user: UserModel = Depends(require_role("admin")),
                           db: Session = Depends(get_db)):
    # Export exactly the same dataset shown in /admin/students
    rows = db.query(StudentModel, UserModel).join(UserModel).all()

    output = io.StringIO()
    writer = csv.writer(output)

    # CSV header
    writer.writerow([
        "Name",
        "ID",
        "Email",
        "Course",
        "Department",
        "Semester",
        "Academic Year",
        "Active",
    ])

    for s, u in rows:
        writer.writerow([
            s.full_name,
            s.student_id,
            u.email,
            s.department,   # "Course" mapped to existing department value
            s.department,
            s.semester,
            s.academic_year or "",
            "Yes" if u.is_active else "No",
        ])

    csv_data = output.getvalue()
    output.close()

    filename = "student_list.csv"
    return StreamingResponse(
        io.BytesIO(csv_data.encode("utf-8")),
        media_type="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename={filename}"
        },
    )



@app.post("/admin/students", status_code=201, tags=["Admin"])
def add_student(payload: StudentCreate,
                current_user: UserModel = Depends(require_role("admin")),
                db: Session = Depends(get_db)):
    if get_user_by_username(db, payload.username):
        raise HTTPException(status_code=400, detail="Username already exists")
    user = UserModel(
        username=payload.username,
        password_hash=hash_password(payload.password),
        role="student",
        email=payload.email,
    )
    db.add(user)
    db.flush()
    student = StudentModel(
        user_id=user.id,
        student_id=payload.student_id,
        full_name=payload.full_name,
        department=payload.department,
        semester=payload.semester,
        academic_year=payload.academic_year,
        phone=payload.phone,
        gender=payload.gender,
        address=payload.address,
    )
    db.add(student)
    db.commit()
    db.refresh(student)
    return {"message": "Student added successfully", "id": student.id}


@app.delete("/admin/students/{student_db_id}", tags=["Admin"])
def remove_student(student_db_id: int,
                   current_user: UserModel = Depends(require_role("admin")),
                   db: Session = Depends(get_db)):
    student = db.query(StudentModel).filter(StudentModel.id == student_db_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    user = db.query(UserModel).filter(UserModel.id == student.user_id).first()
    db.delete(student)
    if user:
        db.delete(user)
    db.commit()
    return {"message": "Student removed successfully"}


@app.post("/admin/marks", tags=["Admin"])
def enter_marks(payload: MarksEntry,
                current_user: UserModel = Depends(require_role("admin")),
                db: Session = Depends(get_db)):
    """Enter or update marks for a student in a subject."""
    student = db.query(StudentModel).filter(StudentModel.id == payload.student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    subject = db.query(SubjectModel).filter(SubjectModel.id == payload.subject_id).first()

    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")

    total = payload.internal_marks + payload.external_marks
    grade = calculate_grade(total)

    result = db.query(ResultModel).filter(
        ResultModel.student_id == payload.student_id,
        ResultModel.subject_id == payload.subject_id,
        ResultModel.semester == payload.semester,
        ResultModel.academic_year == payload.academic_year,
    ).first()

    if result:
        if result.status == "published":
            raise HTTPException(status_code=400, detail="Cannot edit a published result")
        result.internal_marks = payload.internal_marks
        result.external_marks = payload.external_marks
        result.grade = grade
        result.status = "pending"
        result.entered_by = current_user.id
        result.updated_at = datetime.utcnow()
    else:
        result = ResultModel(
            student_id=payload.student_id,
            subject_id=payload.subject_id,
            semester=payload.semester,
            academic_year=payload.academic_year,
            internal_marks=payload.internal_marks,
            external_marks=payload.external_marks,
            grade=grade,
            status="pending",
            entered_by=current_user.id,
        )
        db.add(result)

    db.commit()
    return {"message": "Marks saved successfully", "grade": grade, "total": total}


@app.get("/admin/subjects", tags=["Admin"])
def list_subjects(current_user: UserModel = Depends(require_role("admin", "exam_dept")),
                  db: Session = Depends(get_db)):
    return db.query(SubjectModel).all()


@app.post("/admin/notifications", tags=["Admin"])
def create_notification(payload: NotificationCreate,
                        current_user: UserModel = Depends(require_role("admin", "exam_dept")),
                        db: Session = Depends(get_db)):
    notification = NotificationModel(
        title=payload.title,
        message=payload.message,
        type=payload.type,
        target_role=payload.target_role,
        target_department=payload.target_department,
        target_semester=payload.target_semester,
        created_by=current_user.id,
    )
    db.add(notification)
    db.commit()
    db.refresh(notification)

    return {
        "id": notification.id,
        "title": notification.title,
        "message": notification.message,
        "type": notification.type,
        "target_role": notification.target_role,
        "target_department": notification.target_department,
        "target_semester": notification.target_semester,
        "created_at": notification.created_at,
    }



@app.delete("/api/announcements/{notification_id}", tags=["Admin"])
def delete_announcement(notification_id: int,
                         current_user: UserModel = Depends(require_role("admin", "exam_dept")),
                         db: Session = Depends(get_db)):
    notification = db.query(NotificationModel).filter(NotificationModel.id == notification_id).first()
    if not notification:
        raise HTTPException(status_code=404, detail="Announcement not found")

    # Soft-delete: keep row but hide from students/admin lists
    notification.is_active = False
    db.add(notification)
    db.commit()

    return {"message": "Announcement deleted"}


# ─────────────────────────────────────────────
# EXAMINATION DEPARTMENT ROUTES
# ─────────────────────────────────────────────
@app.get("/exam/results/pending", tags=["Examination Dept"])
def get_pending_results(current_user: UserModel = Depends(require_role("exam_dept")),
                        db: Session = Depends(get_db)):
    rows = (
        db.query(ResultModel, StudentModel, SubjectModel)
        .join(StudentModel, ResultModel.student_id == StudentModel.id)
        .join(SubjectModel, ResultModel.subject_id == SubjectModel.id)
        .filter(ResultModel.status == "pending")
        .all()
    )
    return [
        {
            "result_id": r.id,
            "student_id": st.student_id,
            "full_name": st.full_name,
            "department": st.department,
            "subject_code": s.subject_code,
            "subject_name": s.subject_name,
            "semester": r.semester,
            "academic_year": r.academic_year,
            "internal_marks": r.internal_marks,
            "external_marks": r.external_marks,
            "total_marks": r.internal_marks + r.external_marks,
            "grade": r.grade,
            "status": r.status,
        }
        for r, st, s in rows
    ]


@app.post("/exam/results/{result_id}/verify", tags=["Examination Dept"])
def verify_result(result_id: int,
                  current_user: UserModel = Depends(require_role("exam_dept")),
                  db: Session = Depends(get_db)):
    result = db.query(ResultModel).filter(ResultModel.id == result_id).first()
    if not result:
        raise HTTPException(status_code=404, detail="Result not found")
    if result.status != "pending":
        raise HTTPException(status_code=400, detail=f"Result is already '{result.status}'")
    result.status = "verified"
    result.verified_by = current_user.id
    result.updated_at = datetime.utcnow()
    db.commit()
    return {"message": "Result verified successfully"}


@app.post("/exam/results/{result_id}/publish", tags=["Examination Dept"])
def publish_result(result_id: int,
                   current_user: UserModel = Depends(require_role("exam_dept")),
                   db: Session = Depends(get_db)):
    result = db.query(ResultModel).filter(ResultModel.id == result_id).first()
    if not result:
        raise HTTPException(status_code=404, detail="Result not found")
    if result.status != "verified":
        raise HTTPException(status_code=400, detail="Only verified results can be published")
    result.status = "published"
    result.published_at = datetime.utcnow()
    result.updated_at = datetime.utcnow()
    db.commit()
    return {"message": "Result published successfully"}


@app.post("/exam/results/publish-batch", tags=["Examination Dept"])
def publish_results_batch(result_ids: List[int],
                          current_user: UserModel = Depends(require_role("exam_dept")),
                          db: Session = Depends(get_db)):
    updated = 0
    for rid in result_ids:
        result = db.query(ResultModel).filter(ResultModel.id == rid, ResultModel.status == "verified").first()
        if result:
            result.status = "published"
            result.published_at = datetime.utcnow()
            result.updated_at = datetime.utcnow()
            updated += 1
    db.commit()
    return {"message": f"{updated} result(s) published successfully"}


@app.get("/exam/results/all", tags=["Examination Dept"])
def get_all_results(current_user: UserModel = Depends(require_role("exam_dept", "admin")),
                    db: Session = Depends(get_db)):
    rows = (
        db.query(ResultModel, StudentModel, SubjectModel)
        .join(StudentModel, ResultModel.student_id == StudentModel.id)
        .join(SubjectModel, ResultModel.subject_id == SubjectModel.id)
        .all()
    )
    return [
        {
            "result_id": r.id,
            "student_id": st.student_id,
            "full_name": st.full_name,
            "department": st.department,
            "subject_code": s.subject_code,
            "subject_name": s.subject_name,
            "semester": r.semester,
            "academic_year": r.academic_year,
            "internal_marks": r.internal_marks,
            "external_marks": r.external_marks,
            "total_marks": r.internal_marks + r.external_marks,
            "grade": r.grade,
            "status": r.status,
            "published_at": r.published_at,
        }
        for r, st, s in rows
    ]

# ─────────────────────────────────────────────
# TIMETABLE ROUTES
# ─────────────────────────────────────────────

@app.get("/api/timetable", tags=["Admin"])
def get_timetable_entries(current_user: UserModel = Depends(require_role("admin", "exam_dept")),
                            db: Session = Depends(get_db)):

    rows = db.query(TimetableEntryModel).order_by(TimetableEntryModel.created_at.desc()).all()
    return [
        {
            "id": r.id,
            "day": r.day,
            "subject": r.subject,
            "start_time": r.start_time.strftime("%H:%M"),
            "end_time": r.end_time.strftime("%H:%M"),
            "faculty_name": r.faculty_name,
            "classroom": r.classroom,
            "is_published": r.is_published,
            "created_at": r.created_at,
        }
        for r in rows
    ]


@app.post("/api/timetable", status_code=201, tags=["Admin"])
def create_timetable_entry(payload: TimetableEntryCreate,
                             current_user: UserModel = Depends(require_role("admin", "exam_dept")),
                             db: Session = Depends(get_db)):

    entry = TimetableEntryModel(
        day=payload.day,
        subject=payload.subject,
        start_time=datetime.strptime(payload.start_time, "%H:%M").time(),
        end_time=datetime.strptime(payload.end_time, "%H:%M").time(),
        faculty_name=payload.faculty_name,
        classroom=payload.classroom,
        is_published=False,
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return {
        "id": entry.id,
        "message": "Timetable entry created",
    }


@app.put("/api/timetable/{id}", tags=["Admin"])
def update_timetable_entry(id: int,
                             payload: TimetableEntryUpdate,
                             current_user: UserModel = Depends(require_role("admin")),
                             db: Session = Depends(get_db)):
    entry = db.query(TimetableEntryModel).filter(TimetableEntryModel.id == id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Timetable entry not found")

    # Preserve existing behavior: allow edits regardless; publication visibility controlled by is_published.
    entry.day = payload.day
    entry.subject = payload.subject
    entry.start_time = datetime.strptime(payload.start_time, "%H:%M").time()
    entry.end_time = datetime.strptime(payload.end_time, "%H:%M").time()
    entry.faculty_name = payload.faculty_name
    entry.classroom = payload.classroom

    db.add(entry)
    db.commit()
    db.refresh(entry)

    return {
        "message": "Timetable entry updated",
        "id": entry.id,
    }


@app.delete("/api/timetable/{id}", tags=["Admin"])
def delete_timetable_entry(id: int,
                             current_user: UserModel = Depends(require_role("admin")),
                             db: Session = Depends(get_db)):
    entry = db.query(TimetableEntryModel).filter(TimetableEntryModel.id == id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Timetable entry not found")

    db.delete(entry)
    db.commit()
    return {"message": "Timetable entry deleted"}


@app.put("/api/timetable/publish", tags=["Admin"])
def publish_timetable(current_user: UserModel = Depends(require_role("admin", "exam_dept")),
                        db: Session = Depends(get_db)):

    # Single published set: clear previous and publish the latest records.
    db.query(TimetableEntryModel).update({TimetableEntryModel.is_published: False})

    # Publish all current entries (additive-only model; no refactor). You can adjust to only latest set if needed.
    db.query(TimetableEntryModel).update({TimetableEntryModel.is_published: True})
    db.commit()

    return {"message": "Timetable published successfully"}


@app.get("/student/timetable", tags=["Student"])
def get_student_timetable(current_user: UserModel = Depends(require_role("student")),
                           db: Session = Depends(get_db)):
    rows = (
        db.query(TimetableEntryModel)
        .filter(TimetableEntryModel.is_published == True)
        .order_by(TimetableEntryModel.day.asc(), TimetableEntryModel.start_time.asc())
        .all()
    )
    return [
        {
            "id": r.id,
            "day": r.day,
            "subject": r.subject,
            "start_time": r.start_time.strftime("%H:%M"),
            "end_time": r.end_time.strftime("%H:%M"),
            "faculty_name": r.faculty_name,
            "classroom": r.classroom,
            "created_at": r.created_at,
        }
        for r in rows
    ]








# ─────────────────────────────────────────────
# HEALTH CHECK
# ─────────────────────────────────────────────


@app.get("/health", tags=["System"])
def health_check():
    return {"status": "ok", "timestamp": datetime.utcnow().isoformat()}


@app.get("/", tags=["System"])
def root():
    return {
        "message": "College Dashboard API v1.0.0",
        "status": "running",
        "version": "1.0.0", 
        "docs": "/docs",
        "health": "/health"
    }


# ─────────────────────────────────────────────
# Static Files - Serve Frontend for Production
# ─────────────────────────────────────────────
from fastapi.staticfiles import StaticFiles
import os
frontend_path = os.path.join(os.path.dirname(__file__), "..", "frontend", "dist")
if os.path.exists(frontend_path):
    app.mount("/", StaticFiles(directory=frontend_path, html=True), name="static")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)