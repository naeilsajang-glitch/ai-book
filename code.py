import jwt
import datetime

# 설정 정보
SECRET_KEY = "my_super_secret_key_change_this"
ALGORITHM = "HS256"

def create_access_token(payload_data: dict, expires_delta: int = 30):
    """
    JWT 토큰 생성 함수
    :param payload_data: 토큰에 담을 정보 (유저 ID 등)
    :param expires_delta: 만료 시간 (분 단위)
    """
    payload = payload_data.copy()
    
    # 만료 시간 설정 (현재 시간 + n분)
    expire = datetime.datetime.utcnow() + datetime.timedelta(minutes=expires_delta)
    payload.update({"exp": expire})
    
    # 토큰 발행
    encoded_jwt = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_access_token(token: str):
    """
    JWT 토큰 검증 함수
    """
    try:
        # 토큰 디코딩 (SECRET_KEY가 다르면 여기서 에러 발생)
        decoded_data = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return decoded_data
    except jwt.ExpiredSignatureError:
        return "토큰이 만료되었습니다."
    except jwt.InvalidTokenError:
        return "유효하지 않은 토큰입니다."

# --- 실행 예시 ---

# 1. 정보 담기 (예: 사용자 아이디)
user_info = {"user_id": "gemini_user_123"}

# 2. 토큰 생성
my_token = create_access_token(user_info)
print(f"생성된 JWT: {my_token}")

# 3. 토큰 검증 및 읽기
decoded = verify_access_token(my_token)
print(f"복호화된 데이터: {decoded}")