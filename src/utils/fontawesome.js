// src/utils/fontawesome.js
import { library } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

// Import specific icons you need
import {
  faMusic,
  faPlay,
  faSearch,
  faHeart,
  faDollarSign,
  faDownload,
  faUsers,
  faGear,
  faCreditCard,
  faPlus,
  faStar,
  faCopy,
  faUser,
  faSpinner,
  faLock,
  faVolumeUp,
  faList,
  faBackward,
  faPause,
  faForward,
  faTimes,
  faChevronDown,
  faSignOutAlt,
  faBars,
  faArrowLeft,
  faEye,
  faEdit,
  faTrash,
  faShare,
  faLightbulb,
  faMicrophoneAlt,
  faCheck,
  faExternalLinkAlt,
  faCamera,
  faBriefcase,      // Added for industry section
  faPercentage,     // Added for royalty splits
  faFolderOpen      // Added for roster management
} from '@fortawesome/free-solid-svg-icons'

// Import brands
import {
  faGoogle,
  faPaypal,
  faGithub
} from '@fortawesome/free-brands-svg-icons'

// Add icons to library
library.add(
  // Solid icons
  faMusic,
  faPlay,
  faSearch,
  faHeart,
  faDollarSign,
  faDownload,
  faUsers,
  faGear,
  faCreditCard,
  faPlus,
  faStar,
  faCopy,
  faUser,
  faSpinner,
  faLock,
  faVolumeUp,
  faList,
  faBackward,
  faPause,
  faForward,
  faTimes,
  faChevronDown,
  faSignOutAlt,
  faBars,
  faArrowLeft,
  faEye,
  faEdit,
  faTrash,
  faShare,
  faLightbulb,
  faMicrophoneAlt,
  faCheck,
  faExternalLinkAlt,
  faCamera,
  faBriefcase,      // Added for industry section
  faPercentage,     // Added for royalty splits
  faFolderOpen,     // Added for roster management
  // Brand icons
  faGoogle,
  faPaypal,
  faGithub
)

export { FontAwesomeIcon }