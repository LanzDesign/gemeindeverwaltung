# Custom deutsche Formate (überschreibt Django-Standard)

DATE_FORMAT = 'd.m.Y'
TIME_FORMAT = 'H:i'
DATETIME_FORMAT = 'd.m.Y H:i'
YEAR_MONTH_FORMAT = 'F Y'
MONTH_DAY_FORMAT = 'j. F'
SHORT_DATE_FORMAT = 'd.m.y'
SHORT_DATETIME_FORMAT = 'd.m.Y H:i'

DATE_INPUT_FORMATS = [
    '%d.%m.%Y',  # 28.11.2025
    '%d.%m.%y',  # 28.11.25
    '%d-%m-%Y',  # 28-11-2025
    '%Y-%m-%d',  # 2025-11-28 (Fallback für ISO)
]

DATETIME_INPUT_FORMATS = [
    '%d.%m.%Y %H:%M:%S',
    '%d.%m.%Y %H:%M',
    '%d-%m-%Y %H:%M:%S',
]
