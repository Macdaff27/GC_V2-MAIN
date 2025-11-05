/**
 * Système de logs de développement configurable
 * Désactivé en production pour les performances
 * Fournit un logging structuré avec niveaux, contexte et stockage
 */

/**
 * Niveaux de log disponibles
 * Ordre croissant de sévérité : DEBUG < INFO < WARN < ERROR
 */
export enum LogLevel {
  DEBUG = 0, // Informations de débogage détaillées
  INFO = 1,  // Informations générales
  WARN = 2,  // Avertissements (problèmes potentiels)
  ERROR = 3, // Erreurs (problèmes réels)
}

/**
 * Contexte de log pour enrichir les messages
 * Permet de tracer l'origine et le contexte des logs
 */
export interface LogContext {
  component?: string; // Nom du composant/hook (ex: "useDatabase")
  action?: string;    // Action en cours (ex: "loadClients")
  userId?: string;    // ID utilisateur si applicable
  timestamp?: string; // Timestamp personnalisé (auto-généré sinon)
  [key: string]: any; // Propriétés additionnelles flexibles
}

/**
 * Configuration du système de logging
 * Contrôle le comportement selon l'environnement
 */
export interface LoggerConfig {
  level: LogLevel;        // Niveau minimum de log à afficher
  enableConsole: boolean; // Activation des logs console
  enableStorage: boolean; // Activation du stockage en mémoire
  maxStoredLogs: number;  // Nombre maximum de logs stockés
}

/**
 * Classe principale du système de logging
 * Implémente un logger configurable avec stockage et formatage
 */
class Logger {
  // Configuration par défaut (peut être surchargée)
  private config: LoggerConfig = {
    level: LogLevel.INFO,    // Niveau minimum : INFO
    enableConsole: true,     // Console activée par défaut
    enableStorage: false,    // Stockage désactivé par défaut
    maxStoredLogs: 100,      // Maximum 100 logs en mémoire
  };

  // Stockage des logs en mémoire (si activé)
  private logs: Array<{
    level: LogLevel;
    message: string;
    context?: LogContext;
    timestamp: string
  }> = [];

  /**
   * Configure le logger avec de nouvelles options
   * Fusionne avec la configuration existante
   */
  configure(config: Partial<LoggerConfig>) {
    this.config = { ...this.config, ...config };
  }

  /**
   * Vérifie si un niveau de log doit être affiché
   * @param level - Niveau du message à tester
   * @returns true si le niveau est >= au niveau configuré
   */
  private shouldLog(level: LogLevel): boolean {
    return level >= this.config.level;
  }

  /**
   * Formate un message de log avec tous les éléments de contexte
   * @param level - Niveau du log
   * @param message - Message principal
   * @param context - Contexte additionnel
   * @returns Message formaté prêt pour l'affichage
   */
  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const levelName = LogLevel[level]; // Conversion enum vers string
    const timestamp = context?.timestamp || new Date().toISOString();
    const component = context?.component ? `[${context.component}]` : '';
    const action = context?.action ? `(${context.action})` : '';

    // Format: "2024-01-15T10:30:00.000Z INFO [Component](action): message"
    return `${timestamp} ${levelName} ${component}${action}: ${message}`;
  }

  /**
   * Méthode principale de logging
   * Gère le formatage, le stockage et l'affichage selon la configuration
   */
  private log(level: LogLevel, message: string, context?: LogContext) {
    // Vérification du niveau avant traitement
    if (!this.shouldLog(level)) return;

    const formattedMessage = this.formatMessage(level, message, context);

    // Création de l'entrée de log complète
    const logEntry = {
      level,
      message: formattedMessage,
      context,
      timestamp: new Date().toISOString(),
    };

    // Logging console (si activé)
    if (this.config.enableConsole) {
      // Sélection de la méthode console appropriée selon le niveau
      const consoleMethod = level === LogLevel.ERROR ? 'error' :
                           level === LogLevel.WARN ? 'warn' :
                           level === LogLevel.INFO ? 'info' : 'debug';
      console[consoleMethod](formattedMessage, context || '');
    }

    // Stockage en mémoire (si activé)
    if (this.config.enableStorage) {
      this.logs.push(logEntry);
      // Rotation automatique : suppression du plus ancien si limite atteinte
      if (this.logs.length > this.config.maxStoredLogs) {
        this.logs.shift(); // Remove oldest
      }
    }
  }

  // Méthodes publiques de logging par niveau
  debug(message: string, context?: LogContext) {
    this.log(LogLevel.DEBUG, message, context);
  }

  info(message: string, context?: LogContext) {
    this.log(LogLevel.INFO, message, context);
  }

  warn(message: string, context?: LogContext) {
    this.log(LogLevel.WARN, message, context);
  }

  error(message: string, context?: LogContext) {
    this.log(LogLevel.ERROR, message, context);
  }

  /**
   * Récupère les logs stockés
   * @param level - Niveau minimum (optionnel, tous les niveaux sinon)
   * @returns Copie des logs filtrés
   */
  getLogs(level?: LogLevel): Array<{
    level: LogLevel;
    message: string;
    context?: LogContext;
    timestamp: string
  }> {
    if (level !== undefined) {
      // Filtrage par niveau minimum
      return this.logs.filter(log => log.level >= level);
    }
    return [...this.logs]; // Retour d'une copie pour éviter les modifications externes
  }

  /**
   * Vide le stockage des logs
   */
  clearLogs() {
    this.logs = [];
  }

  /**
   * Exporte tous les logs au format JSON
   * @returns Logs sérialisés en JSON formaté
   */
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }
}

// Instance singleton du logger (une seule instance pour toute l'application)
export const logger = new Logger();

/**
 * Configuration automatique selon l'environnement
 * En développement : logs détaillés activés
 * En production : seulement les erreurs, pour les performances
 */
if (__DEV__) {
  // Configuration développement : tout activé pour le débogage
  logger.configure({
    level: LogLevel.DEBUG,    // Niveau minimum DEBUG (tout afficher)
    enableConsole: true,      // Logs console activés
    enableStorage: true,      // Stockage en mémoire activé
  });
} else {
  // Configuration production : minimal pour les performances
  logger.configure({
    level: LogLevel.ERROR,    // Seulement les erreurs
    enableConsole: false,     // Pas de logs console (pollue la console utilisateur)
    enableStorage: false,     // Pas de stockage (économie mémoire)
  });
}

/**
 * Fonctions de commodité pour un accès direct au logger
 * Permettent d'utiliser les logs sans importer l'instance logger
 */
export const logDebug = (message: string, context?: LogContext) => logger.debug(message, context);
export const logInfo = (message: string, context?: LogContext) => logger.info(message, context);
export const logWarn = (message: string, context?: LogContext) => logger.warn(message, context);
export const logError = (message: string, context?: LogContext) => logger.error(message, context);

/**
 * Hook React pour le logging dans les composants
 * Fournit des méthodes de log automatiquement préfixées avec le nom du composant
 *
 * @param componentName - Nom du composant (ex: "App", "ClientList")
 * @returns Objet avec les méthodes de logging pré-configurées
 *
 * @example
 * ```typescript
 * const MyComponent = () => {
 *   const logger = useLogger('MyComponent');
 *   logger.debug('Composant monté'); // => "[MyComponent]: Composant monté"
 *   // ...
 * };
 * ```
 */
export const useLogger = (componentName: string) => {
  return {
    // Chaque méthode ajoute automatiquement le nom du composant au contexte
    debug: (message: string, context?: Omit<LogContext, 'component'>) =>
      logger.debug(message, { ...context, component: componentName }),

    info: (message: string, context?: Omit<LogContext, 'component'>) =>
      logger.info(message, { ...context, component: componentName }),

    warn: (message: string, context?: Omit<LogContext, 'component'>) =>
      logger.warn(message, { ...context, component: componentName }),

    error: (message: string, context?: Omit<LogContext, 'component'>) =>
      logger.error(message, { ...context, component: componentName }),
  };
};
