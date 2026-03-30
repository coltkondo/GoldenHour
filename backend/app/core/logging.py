"""
Structured logging configuration for Golden Hour.
Uses loguru for simplified structured logging with sensitive data sanitization.
"""

import sys
from typing import Dict, Any
from loguru import logger
from app.core.config import settings


def sanitize_record(record: Dict[str, Any]) -> Dict[str, Any]:
    """Sanitize sensitive data from log records."""
    # Work on a copy to avoid modifying original
    sanitized = record.copy()

    # Check extra dict
    if "extra" in sanitized:
        extra = sanitized["extra"].copy()

        # Redact sensitive headers
        sensitive_keys = [
            "password",
            "token",
            "auth",
            "authorization",
            "jwt",
            "secret",
            "key",
        ]
        for key in sensitive_keys:
            if key in extra:
                extra[key] = "[REDACTED]"

        # Sanitize database URLs
        if "database_url" in extra or "DATABASE_URL" in extra:
            url = extra.get("database_url") or extra.get("DATABASE_URL")
            if url and isinstance(url, str):
                # Mask password in connection string
                import re

                masked = re.sub(r"//[^:]+:[^@]+", "//***:***@", url)
                extra["database_url"] = masked

        sanitized["extra"] = extra

    return sanitized


def configure_logging(
    level: str = "INFO",
    format: str = "console",  # console or json
    log_file: str | None = None,
    rotation: str = "500 MB",
    retention: str = "10 days",
):
    """
    Configure loguru logger with environment-specific settings.

    Args:
        level: Logging level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
        format: Output format (console for dev, json for prod)
        log_file: Path to log file (None for console only)
        rotation: When to rotate log files (size or time, e.g., "500 MB", "12:00")
        retention: How long to keep logs (e.g., "10 days", "10")
    """
    # Remove default logger
    logger.remove()

    # Determine format based on environment or explicit format param
    if format == "json":
        # Use loguru's built-in serializer for valid JSON output.
        # Handles all special characters (newlines, quotes, unicode) correctly.
        logger.add(sys.stdout, level=level, serialize=True)

    else:
        # Development console format with colors
        format_string = (
            "<green>{time:YYYY-MM-DD HH:mm:ss.SSS}</green> | "
            "<level>{level: <8}</level> | "
            "<cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> | "
            "<level>{message}</level>"
        )

        def console_format(record):
            sanitized = sanitize_record(record)
            # Add extras to message if present
            if sanitized.get("extra"):
                record["extra"] = sanitized["extra"]
                format_with_extras = format_string + " | {extra}"
                return format_with_extras + "\n{exception}"
            return format_string + "\n{exception}"

        logger.add(sys.stdout, format=console_format, level=level, colorize=True)

    # Add file handler if log_file specified
    if log_file:
        # JSON format for file logs (better for parsing)
        file_format = "{time:YYYY-MM-DD HH:mm:ss:SSS} | {level: <8} | {name}:{function}:{line} | {message}"

        logger.add(
            log_file,
            format=file_format,
            level=level,
            rotation=rotation,
            retention=retention,
            compression="zip",  # Compress old logs
            encoding="utf-8",
            enqueue=True,  # Thread-safe
        )


# Auto-configure on import using settings from config.py
if __name__ != "__main__":  # Don't configure when imported as module
    configure_logging(
        level=settings.LOG_LEVEL,
        format=settings.LOG_FORMAT,
        log_file=settings.LOG_FILE,
        rotation=settings.LOG_ROTATION,
        retention=settings.LOG_RETENTION,
    )
