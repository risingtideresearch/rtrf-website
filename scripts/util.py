import re

def sanitize_filename(name):
    sanitized = re.sub(r'[<>:"/\\|?*#]', '_', name)

    sanitized = sanitized.strip(' .')
    
    if not sanitized:
        sanitized = "unnamed_layer"
    
    return sanitized
