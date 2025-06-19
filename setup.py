#!/usr/bin/env python3
"""
Setup script for VIB3 CLI
"""

from setuptools import setup, find_packages
import os

# Read the contents of the README file
this_directory = os.path.abspath(os.path.dirname(__file__))
try:
    with open(os.path.join(this_directory, 'README.md'), encoding='utf-8') as f:
        long_description = f.read()
except FileNotFoundError:
    long_description = 'VIB3 Command Line Interface'

# Read requirements
with open('requirements.txt') as f:
    required = []
    for line in f:
        line = line.strip()
        if line and not line.startswith('#'):
            # Extract package name and version
            if '#' in line:
                line = line.split('#')[0].strip()
            required.append(line)

setup(
    name='vib3-cli',
    version='1.0.0',
    author='VIB3 Team',
    author_email='vib3@example.com',
    description='Command Line Interface for VIB3 Project',
    long_description=long_description,
    long_description_content_type='text/markdown',
    url='https://github.com/yourusername/vib3',
    py_modules=['vib3_cli'],
    python_requires='>=3.8',
    install_requires=[
        req for req in required 
        if not any(test_pkg in req for test_pkg in ['pytest', 'pytest-cov', 'pytest-mock'])
    ],
    extras_require={
        'test': [
            req for req in required 
            if any(test_pkg in req for test_pkg in ['pytest', 'pytest-cov', 'pytest-mock'])
        ],
        'dev': [
            'black>=23.0.0',
            'flake8>=6.0.0',
            'mypy>=1.0.0',
            'pre-commit>=3.0.0',
        ],
    },
    entry_points={
        'console_scripts': [
            'vib3=vib3_cli:main',
        ],
    },
    classifiers=[
        'Development Status :: 4 - Beta',
        'Intended Audience :: Developers',
        'Topic :: Software Development :: Libraries :: Python Modules',
        'License :: OSI Approved :: MIT License',
        'Programming Language :: Python :: 3',
        'Programming Language :: Python :: 3.8',
        'Programming Language :: Python :: 3.9',
        'Programming Language :: Python :: 3.10',
        'Programming Language :: Python :: 3.11',
        'Programming Language :: Python :: 3.12',
        'Operating System :: OS Independent',
    ],
    keywords='vib3 cli command-line aws s3 video social',
    project_urls={
        'Bug Reports': 'https://github.com/yourusername/vib3/issues',
        'Source': 'https://github.com/yourusername/vib3',
    },
)