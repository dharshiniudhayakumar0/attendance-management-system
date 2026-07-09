import os


class Config:
    """Base configuration."""

    SECRET_KEY = os.environ.get("SECRET_KEY", "ams-secret-key-change-in-production")

    # JWT settings
    JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "ams-jwt-secret-key-change-in-production")
    JWT_ACCESS_TOKEN_EXPIRES = 60 * 60 * 8   # 8 hours
    JWT_REFRESH_TOKEN_EXPIRES = 60 * 60 * 24 * 30  # 30 days

    # MySQL connection via PyMySQL
    SQLALCHEMY_DATABASE_URI = os.environ.get(
        "DATABASE_URL",
        "mysql+pymysql://root:Dharsh%4010@localhost:3306/attendance_db",
    )

    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ECHO = False  # Set True to log SQL queries

    # JSON settings
    JSON_SORT_KEYS = False


class DevelopmentConfig(Config):
    """Development configuration."""

    DEBUG = True
    SQLALCHEMY_ECHO = True


class ProductionConfig(Config):
    """Production configuration."""

    DEBUG = False


# Map config name → class
config_by_name = {
    "development": DevelopmentConfig,
    "production": ProductionConfig,
    "default": DevelopmentConfig,
}
