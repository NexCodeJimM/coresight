from flask import Blueprint, jsonify
import os

version_bp = Blueprint('version', __name__)

@version_bp.route('/version')
def get_version():
    try:
        with open('.version', 'r') as f:
            version = f.read().strip()
    except:
        version = '0.0.0'
    
    return jsonify({
        'success': True,
        'version': version,
        'update_available': False  # Will be set by the update check service
    }) 