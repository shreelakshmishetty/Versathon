from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from passlib.context import CryptContext

from app.auth.jwt_handler import create_access_token, security, verify_token
from app.database import get_db
from app.models.user import User
from app.schemas.auth import UserRegister, UserLogin, TokenResponse

router = APIRouter()
pwd_context = CryptContext(schemes=['bcrypt'], deprecated='auto')


@router.post('/register', response_model=TokenResponse)
def register(user: UserRegister, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == user.email.lower()).first()
    if existing:
        raise HTTPException(status_code=400, detail='Email already registered')

    new_user = User(
        name=user.name.strip(),
        email=user.email.lower(),
        password_hash=pwd_context.hash(user.password),
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    token = create_access_token(new_user.id)
    return {
        'access_token': token,
        'token_type': 'bearer',
        'user': {'id': new_user.id, 'name': new_user.name, 'email': new_user.email}
    }


@router.post('/login', response_model=TokenResponse)
def login(user: UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user.email.lower()).first()
    if not db_user or not pwd_context.verify(user.password, db_user.password_hash):
        raise HTTPException(status_code=401, detail='Invalid email or password')

    token = create_access_token(db_user.id)
    return {
        'access_token': token,
        'token_type': 'bearer',
        'user': {'id': db_user.id, 'name': db_user.name, 'email': db_user.email}
    }


@router.get('/me')
def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    user_id = verify_token(credentials)
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail='User not found')
    return {'id': user.id, 'name': user.name, 'email': user.email}
