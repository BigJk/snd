module github.com/BigJk/snd

go 1.21

// CGO Problem: https://github.com/go-git/go-git/issues/624
replace github.com/pjbgf/sha1cd => github.com/pjbgf/sha1cd v0.2.3

// Replace with fork to support newer electron versions
replace github.com/asticode/go-astilectron => github.com/BigJk/go-astilectron v0.0.1

require (
	github.com/BigJk/nra v1.0.0-rc
	github.com/PuerkitoBio/goquery v1.5.1
	github.com/alexbrainman/printer v0.0.0-20181008173622-345afe414dee
	github.com/antchfx/xmlquery v1.3.13
	github.com/asdine/storm v2.1.2+incompatible
	github.com/asticode/go-astikit v0.29.1
	github.com/asticode/go-astilectron v0.27.0
	github.com/dgraph-io/badger/v3 v3.2103.5
	github.com/fatih/color v1.9.0
	github.com/fsnotify/fsnotify v1.5.1
	github.com/go-git/go-billy/v5 v5.5.0
	github.com/go-git/go-git/v5 v5.11.0
	github.com/go-rod/rod v0.112.2
	github.com/google/gousb v1.1.2
	github.com/jwalton/go-supportscolor v1.1.0
	github.com/labstack/echo/v4 v4.9.0
	github.com/mattetti/filebuffer v1.0.1
	github.com/patrickmn/go-cache v2.1.0+incompatible
	github.com/samber/lo v1.11.0
	github.com/sbabiv/xml2map v1.2.1
	github.com/vincent-petithory/dataurl v1.0.0
	github.com/vmihailenco/msgpack/v5 v5.3.5
	go.bug.st/serial v1.3.5
	go.etcd.io/bbolt v1.3.3
	golang.org/x/exp v0.0.0-20220303212507-bbda1eaf7a17
	gopkg.in/olahol/melody.v1 v1.0.0-20170518105555-d52139073376
)

require (
	dario.cat/mergo v1.0.0 // indirect
	github.com/DataDog/zstd v1.4.4 // indirect
	github.com/Microsoft/go-winio v0.6.1 // indirect
	github.com/ProtonMail/go-crypto v0.0.0-20230828082145-3c4c8a2d2371 // indirect
	github.com/Sereal/Sereal v0.0.0-20200210135736-180ff2394e8a // indirect
	github.com/andybalholm/cascadia v1.1.0 // indirect
	github.com/antchfx/xpath v1.2.1 // indirect
	github.com/cespare/xxhash v1.1.0 // indirect
	github.com/cespare/xxhash/v2 v2.1.1 // indirect
	github.com/cloudflare/circl v1.3.3 // indirect
	github.com/creack/goselect v0.1.2 // indirect
	github.com/cyphar/filepath-securejoin v0.2.4 // indirect
	github.com/dgraph-io/ristretto v0.1.1 // indirect
	github.com/dustin/go-humanize v1.0.0 // indirect
	github.com/emirpasic/gods v1.18.1 // indirect
	github.com/go-git/gcfg v1.5.1-0.20230307220236-3a3c6141e376 // indirect
	github.com/gogo/protobuf v1.3.2 // indirect
	github.com/golang-jwt/jwt v3.2.2+incompatible // indirect
	github.com/golang/glog v0.0.0-20160126235308-23def4e6c14b // indirect
	github.com/golang/groupcache v0.0.0-20210331224755-41bb18bfe9da // indirect
	github.com/golang/protobuf v1.3.3 // indirect
	github.com/golang/snappy v0.0.3 // indirect
	github.com/google/flatbuffers v1.12.1 // indirect
	github.com/gorilla/websocket v1.5.0 // indirect
	github.com/jbenet/go-context v0.0.0-20150711004518-d14ea06fba99 // indirect
	github.com/kevinburke/ssh_config v1.2.0 // indirect
	github.com/klauspost/compress v1.12.3 // indirect
	github.com/labstack/gommon v0.3.1 // indirect
	github.com/mattn/go-colorable v0.1.11 // indirect
	github.com/mattn/go-isatty v0.0.14 // indirect
	github.com/mitchellh/mapstructure v1.4.3 // indirect
	github.com/pjbgf/sha1cd v0.3.0 // indirect
	github.com/pkg/errors v0.9.1 // indirect
	github.com/sergi/go-diff v1.1.0 // indirect
	github.com/skeema/knownhosts v1.2.1 // indirect
	github.com/valyala/bytebufferpool v1.0.0 // indirect
	github.com/valyala/fasttemplate v1.2.1 // indirect
	github.com/vmihailenco/msgpack v4.0.4+incompatible // indirect
	github.com/vmihailenco/tagparser/v2 v2.0.0 // indirect
	github.com/xanzy/ssh-agent v0.3.3 // indirect
	github.com/ysmood/goob v0.4.0 // indirect
	github.com/ysmood/gson v0.7.3 // indirect
	github.com/ysmood/leakless v0.8.0 // indirect
	go.opencensus.io v0.22.5 // indirect
	golang.org/x/crypto v0.16.0 // indirect
	golang.org/x/mod v0.12.0 // indirect
	golang.org/x/net v0.19.0 // indirect
	golang.org/x/sys v0.15.0 // indirect
	golang.org/x/term v0.15.0 // indirect
	golang.org/x/text v0.14.0 // indirect
	golang.org/x/time v0.0.0-20201208040808-7e3f01d25324 // indirect
	golang.org/x/tools v0.13.0 // indirect
	google.golang.org/appengine v1.6.5 // indirect
	gopkg.in/warnings.v0 v0.1.2 // indirect
)
