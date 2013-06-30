define(['mpdisco', 'player', 'user', 'playlist', 'library'], function(MPDisco, Player, User, Playlist, Library) {
  
  var MasterMode = MPDisco.module('MasterMode', function(MasterMode, MPDisco) {
    var buildLockableMixinFor = function(type) {
      return {
        socketEvents: {
          'master': 'onMasterChanged'
        },
        
        initialize: function() {
          type.prototype.initialize.call(this);
          
          this.listenTo(MPDisco.vent, 'networkready', this.onConnected);
        },
        
        onConnected: function(data) {
          this.updateLock(data.master);
        },
        
        onMasterChanged: function(master) {
          this.updateLock(master);
        },
        
        updateLock: function(master) {
          var lock = true;
          
          master || (master = MPDisco.meta.master);
          
          if (MPDisco.meta.id && master.userid) {
            lock = (master.userid !== MPDisco.meta.id);
          }
          
          this.locked = lock;
          
          this.setLockUI(lock);
        },
      }
    };
    
    MasterMode.PlayerView = Player.PlayerView.extend(_.extend(buildLockableMixinFor(Player.PlayerView), {
      setLockUI: function(lock) {
        this.$('.btn').attr('disabled', lock);
      },
      onDomRefresh: function() {
        this.updateLock();
      }
    }));
    
    MasterMode.PlaylistView = Playlist.PlaylistView.extend(_.extend(buildLockableMixinFor(Playlist.PlaylistView), {
      setLockUI: function(lock) {
        this.ui.playlist.sortable(lock ? 'disable' : 'enable');
        
        this.ui.url.prop('disabled', lock);
        
        this.ui.repeat.toggleClass('disabled', lock);
        this.ui.shuffle.toggleClass('disabled', lock);
      },
      
      onRender: function() {
        Playlist.PlaylistView.prototype.onCompositeCollectionRendered.call(this);
        
        this.updateLock();
      },
      
      setRemoveButton: function() {
        this.ui.remove.toggleClass('disabled', (this.$('.selected').length <= 0 || this.locked));
      },
    }));
    
    MasterMode.LibrarySongView = Library.LibrarySongView.extend(_.extend(buildLockableMixinFor(Library.LibrarySongView), {
      onDomRefresh: function() {
        Library.LibrarySongView.prototype.onDomRefresh.call(this);
        
        this.updateLock();
      },
      
      setLockUI: function(lock) {
        this.$el.draggable(lock ? 'disable' : 'enable');
      }
    }));
    
    MasterMode.LibraryAlbumView = Library.LibraryAlbumView.extend(_.extend(buildLockableMixinFor(Library.LibraryAlbumView), {
      itemView: MasterMode.LibrarySongView,
      
      onDomRefresh: function() {
        Library.LibraryAlbumView.prototype.onDomRefresh.call(this);
        
        this.updateLock();
      },
      
      setLockUI: function(lock) {
        this.$el.draggable(lock ? 'disable' : 'enable');
      }
    }));
    
    MasterMode.LibraryArtistView = Library.LibraryArtistView.extend(_.extend(buildLockableMixinFor(Library.LibraryArtistView), {
      itemView: MasterMode.LibraryAlbumView,
      
      onDomRefresh: function() {
        Library.LibraryArtistView.prototype.onDomRefresh.call(this);
        
        this.updateLock();
      },
      
      setLockUI: function(lock) {
        this.$el.draggable(lock ? 'disable' : 'enable');
      }
    }));
    
    MasterMode.LibraryView = Library.LibraryView.extend({
      itemView: MasterMode.LibraryArtistView
    });
    
    MasterMode.Mode = {
      player: MasterMode.PlayerView,
      user: User.UserView,
      scrubber: Player.ScrubberView,
      playlist: MasterMode.PlaylistView,
      library: MasterMode.LibraryView
    };
  });
  
  return MasterMode;
});
