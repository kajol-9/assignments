import streamlit as st
import asyncio
from client import get_all_data

st.set_page_config(page_title="Concurrent API Aggregator", layout="wide")
st.title("Async API Aggregator")

st.sidebar.header("Settings")
timeout = st.sidebar.slider("Timeout per API (seconds)", 0.5, 5.0, 2.0)

if st.button("Fetch Data from 10 APIs"):
    with st.spinner("Calling all APIs concurrently..."):
        # Run the async code from the sync Streamlit environment
        results = asyncio.run(get_all_data(timeout))
    
    # Display Results
    st.subheader("Aggregated Results")
    cols = st.columns(2)
    
    for i, res in enumerate(results):
        with cols[i % 2]:
            if "error" in res:
                st.error(f"API {res['api_id']}: {res['error']}")
            else:
                st.success(f"API {res['api_id']}: {res['data']}")


st.info("Note: Ensure server.py is running on localhost:8080")
