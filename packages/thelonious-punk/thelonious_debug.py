import logging
import os
from logging.handlers import RotatingFileHandler

class TheloniousLogger:
    def __init__(self):
        self.logger = logging.getLogger('thelonious')
        self.logger.setLevel(logging.INFO)

        # Create logs directory if it doesn't exist
        log_dir = os.path.join(os.path.dirname(__file__), 'logs')
        os.makedirs(log_dir, exist_ok=True)

        # Set up rotating file handler for narrative log
        narrative_log = os.path.join(log_dir, 'narrative_log.txt')
        handler = RotatingFileHandler(
            narrative_log,
            maxBytes=10485760,  # 10MB
            backupCount=5,
            encoding='utf-8'
        )
        handler.setFormatter(logging.Formatter(
            '%(asctime)s - %(levelname)s - %(message)s'
        ))
        self.logger.addHandler(handler)

    def log(self, message):
        """Log a message using the rotating file handler"""
        self.logger.info(message)
