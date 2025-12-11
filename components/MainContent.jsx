'use client'

import { 
  FaChevronLeft, 
  FaChevronRight, 
  FaPlay,
  FaPause
} from 'react-icons/fa'
import { useMusicPlayer } from '@/contexts/MusicPlayerContext'
import AmbientVoiceOverlay from './AmbientVoiceOverlay'
import styles from './MainContent.module.css'

const MainContent = ({ currentView, mixedTracks, setMixedTracks }) => {
  const { playTrack, currentTrack, isPlaying } = useMusicPlayer()

  const featuredPlaylists = [
    { 
      id: 1, 
      title: 'Today\'s Top Hits', 
      artist: 'Various Artists', 
      cover: 'linear-gradient(135deg, #8d67ab 0%, #5a3d7a 100%)',
      coverImage: '🔥'
    },
    { 
      id: 2, 
      title: 'RapCaviar', 
      artist: 'Various Artists', 
      cover: 'linear-gradient(135deg, #ba5d07 0%, #8a4505 100%)',
      coverImage: '🎧'
    },
    { 
      id: 3, 
      title: 'All Out 2010s', 
      artist: 'Various Artists', 
      cover: 'linear-gradient(135deg, #e8115b 0%, #b00d47 100%)',
      coverImage: '📻'
    },
    { 
      id: 4, 
      title: 'Rock Classics', 
      artist: 'Various Artists', 
      cover: 'linear-gradient(135deg, #477d95 0%, #2f5468 100%)',
      coverImage: '🎸'
    },
    { 
      id: 5, 
      title: 'Chill Hits', 
      artist: 'Various Artists', 
      cover: 'linear-gradient(135deg, #1e3264 0%, #0f1a3d 100%)',
      coverImage: '🌙'
    },
    { 
      id: 6, 
      title: 'Viva Latino', 
      artist: 'Various Artists', 
      cover: 'linear-gradient(135deg, #dc148c 0%, #a50f69 100%)',
      coverImage: '💃'
    },
  ]

  const recentlyPlayed = [
    { 
      id: 1, 
      title: 'Perfect', 
      artist: 'Ed Sheeran', 
      cover: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      coverImage: '🎸',
      src: '/music/Edd_Sheeran_-_Perfect_(mp3.pm).mp3'
    },
    { 
      id: 2, 
      title: 'Story of My Life', 
      artist: 'One Direction', 
      cover: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      coverImage: '🎤',
      src: '/music/One_Direction_-_story_my_life_(mp3.pm).mp3'
    },
    { 
      id: 3, 
      title: 'Tamil Song', 
      artist: 'Tamil Artist', 
      cover: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      coverImage: '🎵',
      src: '/music/tamil.mp3'
    },
    { 
      id: 4, 
      title: 'Heat Waves', 
      artist: 'Glass Animals', 
      cover: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      coverImage: '🌊'
    },
    { 
      id: 5, 
      title: 'Blinding Lights', 
      artist: 'The Weeknd', 
      cover: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      coverImage: '✨'
    },
    { 
      id: 6, 
      title: 'Watermelon Sugar', 
      artist: 'Harry Styles', 
      cover: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
      coverImage: '🍉'
    },
  ]

  const madeForYou = [
    { 
      id: 1, 
      title: 'Daily Mix 1', 
      artist: 'Made for you', 
      cover: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      coverImage: '1'
    },
    { 
      id: 2, 
      title: 'Daily Mix 2', 
      artist: 'Made for you', 
      cover: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      coverImage: '2'
    },
    { 
      id: 3, 
      title: 'Daily Mix 3', 
      artist: 'Made for you', 
      cover: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      coverImage: '3'
    },
    { 
      id: 4, 
      title: 'Daily Mix 4', 
      artist: 'Made for you', 
      cover: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      coverImage: '4'
    },
    { 
      id: 5, 
      title: 'Daily Mix 5', 
      artist: 'Made for you', 
      cover: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      coverImage: '5'
    },
    { 
      id: 6, 
      title: 'Daily Mix 6', 
      artist: 'Made for you', 
      cover: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
      coverImage: '6'
    },
  ]

  const renderContent = () => {
    switch (currentView) {
      case 'home':
        return (
          <>
            <div className={styles.contentHeader}>
              <div className={styles.navButtons}>
                <button className={styles.navBtn}>
                  <FaChevronLeft />
                </button>
                <button className={styles.navBtn}>
                  <FaChevronRight />
                </button>
              </div>
              <div className={styles.userMenu}>
                <button className={styles.upgradeBtn}>Upgrade</button>
                <div className={styles.userProfile}>
                  <span>User</span>
                  <div className={styles.profileIcon}></div>
                </div>
              </div>
            </div>

            <div className={styles.contentBody}>
              {/* Ambient Voice Overlay Feature */}
              <AmbientVoiceOverlay 
                onTrackCreated={(track) => {
                  setMixedTracks(prev => [track, ...prev])
                }}
              />

              <div className={styles.section}>
                <h2 className={styles.sectionTitle}>Good evening</h2>
                <div className={styles.quickAccessGrid}>
                  {/* Show mixed tracks first */}
                  {mixedTracks.map((item) => {
                    const isCurrentTrack = currentTrack?.id === item.id
                    return (
                      <div 
                        key={item.id} 
                        className={`${styles.quickAccessItem} ${isCurrentTrack ? styles.activeTrack : ''}`}
                        onClick={() => item.src && playTrack(item)}
                      >
                      <div 
                        className={styles.quickAccessCover} 
                        style={{ background: item.cover }}
                      >
                        {item.coverImage && (
                          <span className={styles.coverEmoji}>{item.coverImage}</span>
                        )}
                        <span className={styles.mixedBadge}>🎤 MIXED</span>
                      </div>
                        <span className={styles.quickAccessTitle}>{item.title}</span>
                        {item.src && (
                          <button 
                            className={styles.quickAccessPlay}
                            onClick={(e) => {
                              e.stopPropagation()
                              playTrack(item)
                            }}
                          >
                            {isCurrentTrack && isPlaying ? <FaPause /> : <FaPlay />}
                          </button>
                        )}
                      </div>
                    )
                  })}
                  {/* Original tracks */}
                  {recentlyPlayed.slice(0, 6 - mixedTracks.length).map((item) => {
                    const isCurrentTrack = currentTrack?.id === item.id
                    return (
                      <div 
                        key={item.id} 
                        className={`${styles.quickAccessItem} ${isCurrentTrack ? styles.activeTrack : ''}`}
                        onClick={() => item.src && playTrack(item)}
                      >
                      <div 
                        className={styles.quickAccessCover} 
                        style={{ background: item.cover }}
                      >
                        {item.coverImage && (
                          <span className={styles.coverEmoji}>{item.coverImage}</span>
                        )}
                      </div>
                        <span className={styles.quickAccessTitle}>{item.title}</span>
                        {item.src && (
                          <button 
                            className={styles.quickAccessPlay}
                            onClick={(e) => {
                              e.stopPropagation()
                              playTrack(item)
                            }}
                          >
                            {isCurrentTrack && isPlaying ? <FaPause /> : <FaPlay />}
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className={styles.section}>
                <div className={styles.sectionHeader}>
                  <h2 className={styles.sectionTitle}>Made for You</h2>
                  <a href="#" className={styles.showAll}>Show all</a>
                </div>
                <div className={styles.cardGrid}>
                  {madeForYou.map((item) => (
                    <div key={item.id} className={styles.card}>
                      <div className={styles.cardCoverContainer}>
                        <div 
                          className={styles.cardCover} 
                          style={{ background: item.cover }}
                        >
                          {item.coverImage && (
                            <span className={styles.cardCoverImage}>{item.coverImage}</span>
                          )}
                        </div>
                        <button className={styles.cardPlayBtn}>
                          <FaPlay />
                        </button>
                      </div>
                      <div className={styles.cardInfo}>
                        <h3 className={styles.cardTitle}>{item.title}</h3>
                        <p className={styles.cardSubtitle}>{item.artist}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className={styles.section}>
                <div className={styles.sectionHeader}>
                  <h2 className={styles.sectionTitle}>Popular playlists</h2>
                  <a href="#" className={styles.showAll}>Show all</a>
                </div>
                <div className={styles.cardGrid}>
                  {featuredPlaylists.map((item) => (
                    <div key={item.id} className={styles.card}>
                      <div className={styles.cardCoverContainer}>
                        <div 
                          className={styles.cardCover} 
                          style={{ background: item.cover }}
                        >
                          {item.coverImage && (
                            <span className={styles.cardCoverImage}>{item.coverImage}</span>
                          )}
                        </div>
                        <button className={styles.cardPlayBtn}>
                          <FaPlay />
                        </button>
                      </div>
                      <div className={styles.cardInfo}>
                        <h3 className={styles.cardTitle}>{item.title}</h3>
                        <p className={styles.cardSubtitle}>{item.artist}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )
      case 'search':
        return (
          <div className={styles.searchView}>
            <div className={styles.contentHeader}>
              <div className={styles.navButtons}>
                <button className={styles.navBtn}>
                  <FaChevronLeft />
                </button>
                <button className={styles.navBtn}>
                  <FaChevronRight />
                </button>
              </div>
              <div className={styles.userMenu}>
                <button className={styles.upgradeBtn}>Upgrade</button>
                <div className={styles.userProfile}>
                  <span>User</span>
                  <div className={styles.profileIcon}></div>
                </div>
              </div>
            </div>
            <div className={styles.searchContent}>
              <h1 className={styles.searchTitle}>Search</h1>
              <div className={styles.searchCategories}>
                {['Rock', 'Pop', 'Hip-Hop', 'Jazz', 'Electronic', 'R&B', 'Country', 'Classical'].map((genre) => (
                  <div key={genre} className={styles.categoryCard}>
                    <span className={styles.categoryText}>{genre}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )
      case 'library':
        return (
          <div className={styles.libraryView}>
            <div className={styles.contentHeader}>
              <div className={styles.navButtons}>
                <button className={styles.navBtn}>
                  <FaChevronLeft />
                </button>
                <button className={styles.navBtn}>
                  <FaChevronRight />
                </button>
              </div>
              <div className={styles.userMenu}>
                <button className={styles.upgradeBtn}>Upgrade</button>
                <div className={styles.userProfile}>
                  <span>User</span>
                  <div className={styles.profileIcon}></div>
                </div>
              </div>
            </div>
            <div className={styles.libraryContent}>
              <div className={styles.libraryHeader}>
                <h1 className={styles.libraryTitle}>Your Library</h1>
                <div className={styles.libraryFilters}>
                  <button className={`${styles.libraryFilterBtn} ${styles.active}`}>Playlists</button>
                  <button className={styles.libraryFilterBtn}>Artists</button>
                  <button className={styles.libraryFilterBtn}>Albums</button>
                </div>
              </div>
              <div className={styles.libraryGrid}>
                {madeForYou.map((item) => (
                  <div key={item.id} className={styles.libraryCard}>
                    <div 
                      className={styles.libraryCardCover} 
                      style={{ background: item.cover }}
                    >
                      {item.coverImage && (
                        <span className={styles.libraryCoverImage}>{item.coverImage}</span>
                      )}
                    </div>
                    <div className={styles.libraryCardInfo}>
                      <h3 className={styles.libraryCardTitle}>{item.title}</h3>
                      <p className={styles.libraryCardSubtitle}>Playlist • {item.artist}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className={styles.mainContent}>
      {renderContent()}
    </div>
  )
}

export default MainContent

