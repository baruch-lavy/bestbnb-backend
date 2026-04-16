export function useStickyHeader(isDetailsPage) {
  const [showSticky, setShowSticky] = useState(isDetailsPage)
  const [forceExpand, setForceExpand] = useState(false)

  //  Toggle sticky header based on scroll (only if NOT manually expanded or on details page)
  useEffect(() => {
    if (!isDetailsPage && !forceExpand) {
      const handleScroll = () => {
        setShowSticky(window.scrollY > 50)
      }
      window.addEventListener('scroll', handleScroll)
      return () => window.removeEventListener('scroll', handleScroll)
    }
  }, [isDetailsPage, forceExpand])

  //  Expand full search mode when clicking sticky bar
  const handleStickyClick = () => {
    setForceExpand(true)
    setShowSticky(false)
  }

  //  Collapse back to sticky mode when clicking outside
  useEffect(() => {
    if (forceExpand) {
      const handleClickOutside = (event) => {
        if (
          !document.querySelector('.full-search-bar')?.contains(event.target) &&
          !document.querySelector('.header')?.contains(event.target)
        ) {
          setForceExpand(false)
          setShowSticky(true)
        }
      };
      document.addEventListener('mousedown', handleClickOutside)
      return () =>
        document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [forceExpand])

  return { showSticky, forceExpand, handleStickyClick }
}

return (
  <>
    {showSticky && !forceExpand && !isDashboardPage && (
      <div className='sticky-search-wrapper' onClick={handleStickyClick}>
        <StickySearchBar
          openDropdown={openDropdown}
          handleDropdownOpen={handleDropdownOpen}
          handleSearch={handleSearch}
        />
      </div>
    )}
    {!isDashboardPage && (
      <div
        className={`full-search-bar ${
          showSticky && !forceExpand ? 'hidden' : ''
        }`}
      >
        <SearchBar
          openDropdown={openDropdown}
          handleDropdownOpen={handleDropdownOpen}
          handleSearch={handleSearch}
        />
      </div>
    )}
  </>
)
