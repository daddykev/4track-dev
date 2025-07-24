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
  faCopy
} from '@fortawesome/free-solid-svg-icons'

// Import brands
import {
  faGoogle,
  faPaypal
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
  // Brand icons
  faGoogle,
  faPaypal
)

export { FontAwesomeIcon }