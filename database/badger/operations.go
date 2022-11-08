package badger

import (
	"github.com/dgraph-io/badger/v3"
	"github.com/vmihailenco/msgpack/v5"
)

func fetchSingle[T any](db *badger.DB, key string) (T, error) {
	var elem T

	if err := db.View(func(txn *badger.Txn) error {
		data, err := txn.Get([]byte(key))
		if err != nil {
			return err
		}

		return data.Value(func(val []byte) error {
			return msgpack.Unmarshal(val, &elem)
		})
	}); err != nil {
		return elem, err
	}

	return elem, nil
}

func setSingle[T any](db *badger.DB, key string, val T) error {
	data, err := msgpack.Marshal(val)
	if err != nil {
		return err
	}

	return db.Update(func(txn *badger.Txn) error {
		return txn.Set([]byte(key), data)
	})
}

func dropSingle(db *badger.DB, key string) error {
	return db.Update(func(txn *badger.Txn) error {
		return txn.Delete([]byte(key))
	})
}

func dropAll(db *badger.DB, prefix string) error {
	var toDelete [][]byte

	if err := db.View(func(txn *badger.Txn) error {
		opts := badger.DefaultIteratorOptions
		opts.PrefetchValues = false

		it := txn.NewIterator(opts)
		defer it.Close()

		prefixBytes := []byte(prefix)
		for it.Seek(prefixBytes); it.ValidForPrefix(prefixBytes); it.Next() {
			key := it.Item().KeyCopy(nil)
			toDelete = append(toDelete, key)
		}

		return nil
	}); err != nil {
		return err
	}

	return db.Update(func(txn *badger.Txn) error {
		for i := range toDelete {
			if err := txn.Delete(toDelete[i]); err != nil {
				return err
			}
		}
		return nil
	})
}

func fetchAll[T any](db *badger.DB, prefix string, filter func(string) bool) ([]T, error) {
	var elems []T

	if err := db.View(func(txn *badger.Txn) error {
		it := txn.NewIterator(badger.DefaultIteratorOptions)
		defer it.Close()

		prefixBytes := []byte(prefix)
		for it.Seek(prefixBytes); it.ValidForPrefix(prefixBytes); it.Next() {
			if filter != nil && !filter(string(it.Item().Key())) {
				continue
			}

			err := it.Item().Value(func(val []byte) error {
				var elem T

				err := msgpack.Unmarshal(val, &elem)
				if err != nil {
					return err
				}

				elems = append(elems, elem)
				return nil
			})
			if err != nil {
				return err
			}
		}

		return nil
	}); err != nil {
		return elems, err
	}

	return elems, nil
}

func countAll(db *badger.DB, prefix string, filter func(string) bool) (int, error) {
	count := 0

	if err := db.View(func(txn *badger.Txn) error {
		opts := badger.DefaultIteratorOptions
		opts.PrefetchValues = false

		it := txn.NewIterator(opts)
		defer it.Close()

		prefixBytes := []byte(prefix)
		for it.Seek(prefixBytes); it.ValidForPrefix(prefixBytes); it.Next() {
			if filter != nil && !filter(string(it.Item().Key())) {
				continue
			}

			count++
		}

		return nil
	}); err != nil {
		return 0, err
	}

	return count, nil
}
