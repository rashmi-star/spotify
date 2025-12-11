'use client'

import { 
  FaHome, 
  FaSearch, 
  FaBook, 
  FaPlus, 
  FaHeart,
  FaMusic,
  FaDownload
} from 'react-icons/fa'
import styles from './Sidebar.module.css'

const Sidebar = ({ currentView, setCurrentView }) => {
  const menuItems = [
    { id: 'home', icon: FaHome, label: 'Home', active: currentView === 'home' },
    { id: 'search', icon: FaSearch, label: 'Search', active: currentView === 'search' },
    { id: 'library', icon: FaBook, label: 'Your Library', active: currentView === 'library' },
  ]

  const playlists = [
    'Liked Songs',
    'Recently Played',
    'My Playlist #1',
    'Chill Vibes',
    'Workout Mix',
    'Study Focus',
  ]

  return (
    <div className={styles.sidebar}>
      <div className={styles.sidebarHeader}>
        <div className={styles.logo}>
          <FaMusic className={styles.logoIcon} />
          <span className={styles.logoText}>Spotify</span>
        </div>
      </div>

      <nav className={styles.sidebarNav}>
        {menuItems.map((item) => {
          const Icon = item.icon
          return (
            <div
              key={item.id}
              className={`${styles.navItem} ${item.active ? styles.active : ''}`}
              onClick={() => setCurrentView(item.id)}
            >
              <Icon className={styles.navIcon} />
              <span>{item.label}</span>
            </div>
          )
        })}
      </nav>

      <div className={styles.sidebarPlaylists}>
        <div className={styles.playlistsHeader}>
          <div className={styles.playlistAction}>
            <FaBook className={styles.playlistIcon} />
            <span>Your Library</span>
          </div>
          <div className={styles.playlistActions}>
            <FaPlus className={styles.actionIcon} />
            <FaDownload className={styles.actionIcon} />
          </div>
        </div>

        <div className={styles.playlistsFilter}>
          <button className={`${styles.filterBtn} ${styles.active}`}>Playlists</button>
          <button className={styles.filterBtn}>Artists</button>
          <button className={styles.filterBtn}>Albums</button>
        </div>

        <div className={styles.playlistsList}>
          <div className={styles.playlistItem}>
            <FaHeart className={styles.playlistItemIcon} />
            <span>Liked Songs</span>
          </div>
          {playlists.slice(1).map((playlist, index) => (
            <div key={index} className={styles.playlistItem}>
              <div className={styles.playlistItemCover}></div>
              <span>{playlist}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Sidebar

