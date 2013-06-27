(function() {
  var BasicMode = require('./basic_mode.js'),
      ClientsManager = require('./clients_manager.js')();
      _ = require('underscore');
  
  var MasterMode = BasicMode.extend({
    init: function(mpd, cmdProcessors) {
      this._super(mpd, cmdProcessors);
      
      this.type = 'master';
      
      this.master = null;
      
      ClientsManager.on('disconnected', this.disconnected.bind(this));
      
      ClientsManager.on('connected', this.connected.bind(this));
    },
    
    connected: function(client) {
      if (!this.master && !ClientsManager.isEmpty()) {
        this.setMaster(ClientsManager.first());
      }
      
      console.log(client);
      
      client.emit('connected', {
        id: client.info.userid,
        info: client.info,
        clients: ClientsManager.clientsInfo(),
        mode: this.type,
        master: this.master
      });
      client.broadcast.emit('clientconnected', client.info);
    },
    
    disconnected: function(client) {
      console.log('MASTER_MODE :: DISCONNECTED');
      
      console.log(ClientsManager.clientsInfo());
      
      if (ClientsManager.isEmpty()) {
        this.clearMaster();
      } else if (!this.isMaster(ClientsManager.first())) {
        this.setMaster(ClientsManager.first());
      }
    },
    
    rotate: function() {
      if (Clients.isEmpty()) {
        return;
      }
      
      ClientsManager.rotate();
      
      this.setMaster(ClientsManager.first());
    },
    
    canExecute: function(command, client) {
      return this.isMaster(client) || this.isWhitelistCommand(command);
    },
    
    isMaster: function(client) {
      return this.master === client.info.userid;
    },
    
    setMaster: function(client) {
      console.log('master changed');
      
      if (!client) {
        this.master = null;
        return;
      }
      
      this.master = client.info.userid;

      client.emit('master', this.master);
      client.broadcast.emit('master', this.master);
    },
    clearMaster: function() {
      this.setMaster(null);
    },
    
    isWhitelistCommand: function(cmd) {
      return (this.commandWhitelist.indexOf(cmd) !== -1);
    },
    
    commandWhitelist: ['currentsong', 'status', 'playlistinfo', 'list', 'find']
    
  });
  
  if (this.define && define.amd) {
    // Publish as AMD module
    define(function() {
      return MasterMode;
    });
  } else if (typeof(module) != 'undefined' && module.exports) {
    // Publish as node.js module
    module.exports = MasterMode;
  }
})();
