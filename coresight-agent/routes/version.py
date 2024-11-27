from flask import Blueprint, jsonify
from version import VERSION

version_bp = Blueprint('version', __name__)

@version_bp.route('/version')
def get_version():
    try:
        with open('.version', 'r') as f:
            version = f.read().strip()
    except:
        version = VERSION
    
    return jsonify({
        'success': True,
        'version': version,
        'update_available': False
    }) 