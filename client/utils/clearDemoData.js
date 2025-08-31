// Utility script to clear any demo data from localStorage
// This can be run in the browser console

(function clearDemoData() {
  console.log('🧹 Clearing demo data from localStorage...');
  
  // List all localStorage keys
  const keys = Object.keys(localStorage);
  console.log('📋 Found localStorage keys:', keys);
  
  // Clear all localStorage items
  keys.forEach(key => {
    console.log(`🗑️ Removing: ${key}`);
    localStorage.removeItem(key);
  });
  
  // Clear sessionStorage as well
  sessionStorage.clear();
  
  console.log('✅ Demo data cleared from browser storage');
  console.log('🔄 Please refresh the page to ensure clean state');
})();
