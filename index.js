/**
 * Menura entry point.
 * react-native-get-random-values must be imported BEFORE uuid is used anywhere.
 */
import 'react-native-get-random-values';

import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => App);
