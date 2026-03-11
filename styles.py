"""CSS styles for PDF Tools Pro."""

LIGHT_CSS = """
<style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

    .stApp { font-family: 'Inter', sans-serif; }

    .hero {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        padding: 2rem;
        border-radius: 16px;
        color: white;
        margin-bottom: 2rem;
        text-align: center;
    }
    .hero h1 { font-size: 2.2rem; font-weight: 700; margin-bottom: 0.3rem; color: white; }
    .hero p { font-size: 1rem; opacity: 0.9; margin-bottom: 0; color: white; }

    .stat-card {
        background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
        padding: 1rem 1.2rem;
        border-radius: 12px;
        text-align: center;
        margin-bottom: 0.5rem;
    }
    .stat-card h3 { font-size: 1.5rem; font-weight: 700; margin: 0; color: #333; }
    .stat-card p { font-size: 0.85rem; color: #666; margin: 0; }

    .result-card {
        background: #f0fdf4;
        border: 1px solid #bbf7d0;
        border-radius: 12px;
        padding: 1.5rem;
        margin: 1rem 0;
    }

    .security-badge {
        background: #eff6ff;
        border: 1px solid #bfdbfe;
        border-radius: 8px;
        padding: 0.8rem 1rem;
        font-size: 0.85rem;
        margin-top: 1rem;
    }

    .footer {
        text-align: center;
        padding: 1.5rem;
        color: #999;
        font-size: 0.8rem;
        border-top: 1px solid #eee;
        margin-top: 3rem;
    }

    .tool-card {
        background: #fff;
        border: 1px solid #e5e7eb;
        border-radius: 12px;
        padding: 1.2rem;
        text-align: center;
        transition: all 0.2s;
        cursor: pointer;
        margin-bottom: 0.5rem;
    }
    .tool-card:hover { border-color: #667eea; box-shadow: 0 4px 12px rgba(102,126,234,0.15); }
    .tool-card .icon { font-size: 2rem; margin-bottom: 0.5rem; }
    .tool-card .name { font-size: 0.9rem; font-weight: 600; color: #333; }

    .history-item {
        background: #f8f9fa;
        border-radius: 8px;
        padding: 0.6rem 1rem;
        margin-bottom: 0.3rem;
        font-size: 0.85rem;
        display: flex;
        justify-content: space-between;
    }
    .history-time { color: #999; font-size: 0.8rem; }

    .category-header {
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: #999;
        margin: 1rem 0 0.3rem 0;
        padding-left: 0.5rem;
    }

    #MainMenu {visibility: hidden;}
    footer {visibility: hidden;}
    header {visibility: hidden;}

    .stFileUploader > div > div { border-radius: 12px; }
    .stButton > button[kind="primary"] { border-radius: 8px; font-weight: 600; padding: 0.5rem 2rem; }
    .stDownloadButton > button { border-radius: 8px; font-weight: 600; }
</style>
"""

DARK_CSS = """
<style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

    .stApp { font-family: 'Inter', sans-serif; }

    .hero {
        background: linear-gradient(135deg, #434190 0%, #553c7b 100%);
        padding: 2rem;
        border-radius: 16px;
        color: #e0e0e0;
        margin-bottom: 2rem;
        text-align: center;
    }
    .hero h1 { font-size: 2.2rem; font-weight: 700; margin-bottom: 0.3rem; color: #fff; }
    .hero p { font-size: 1rem; opacity: 0.9; margin-bottom: 0; color: #ccc; }

    .stat-card {
        background: linear-gradient(135deg, #2d2d3d 0%, #3a3a50 100%);
        padding: 1rem 1.2rem;
        border-radius: 12px;
        text-align: center;
        margin-bottom: 0.5rem;
    }
    .stat-card h3 { font-size: 1.5rem; font-weight: 700; margin: 0; color: #e0e0e0; }
    .stat-card p { font-size: 0.85rem; color: #aaa; margin: 0; }

    .result-card {
        background: #1a2e1a;
        border: 1px solid #2d5a2d;
        border-radius: 12px;
        padding: 1.5rem;
        margin: 1rem 0;
    }

    .security-badge {
        background: #1a2540;
        border: 1px solid #2d4a6f;
        border-radius: 8px;
        padding: 0.8rem 1rem;
        font-size: 0.85rem;
        margin-top: 1rem;
        color: #b0c4de;
    }

    .footer {
        text-align: center;
        padding: 1.5rem;
        color: #666;
        font-size: 0.8rem;
        border-top: 1px solid #333;
        margin-top: 3rem;
    }

    .tool-card {
        background: #2a2a3d;
        border: 1px solid #3a3a50;
        border-radius: 12px;
        padding: 1.2rem;
        text-align: center;
        transition: all 0.2s;
        cursor: pointer;
        margin-bottom: 0.5rem;
    }
    .tool-card:hover { border-color: #667eea; box-shadow: 0 4px 12px rgba(102,126,234,0.2); }
    .tool-card .icon { font-size: 2rem; margin-bottom: 0.5rem; }
    .tool-card .name { font-size: 0.9rem; font-weight: 600; color: #e0e0e0; }

    .history-item {
        background: #2a2a3d;
        border-radius: 8px;
        padding: 0.6rem 1rem;
        margin-bottom: 0.3rem;
        font-size: 0.85rem;
        display: flex;
        justify-content: space-between;
        color: #ccc;
    }
    .history-time { color: #777; font-size: 0.8rem; }

    .category-header {
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: #777;
        margin: 1rem 0 0.3rem 0;
        padding-left: 0.5rem;
    }

    #MainMenu {visibility: hidden;}
    footer {visibility: hidden;}
    header {visibility: hidden;}

    .stFileUploader > div > div { border-radius: 12px; }
    .stButton > button[kind="primary"] { border-radius: 8px; font-weight: 600; padding: 0.5rem 2rem; }
    .stDownloadButton > button { border-radius: 8px; font-weight: 600; }
</style>
"""
