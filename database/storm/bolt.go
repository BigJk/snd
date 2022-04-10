package storm

import (
	"bytes"

	"github.com/asdine/storm"

	"go.etcd.io/bbolt"
)

func fetchSingle[T any](db *storm.DB, bucket string, id string, from ...string) (T, error) {
	var elem T

	if err := db.From(from...).Get(bucket, id, &elem); err != nil {
		return elem, err
	}

	return elem, nil
}

func fetchFromBucket[T any](db *storm.DB, node string, bucket string) ([]T, error) {
	var entries []T

	err := db.Bolt.Update(func(tx *bbolt.Tx) error {
		var c *bbolt.Cursor

		if len(node) > 0 {
			outerBucket := db.From(node).GetBucket(tx)
			if outerBucket == nil {
				return nil
			}

			b, err := outerBucket.CreateBucketIfNotExists([]byte(bucket))
			if err != nil {
				return err
			}
			c = b.Cursor()
		} else {
			b, err := tx.CreateBucketIfNotExists([]byte(bucket))
			if err != nil {
				return err
			}
			c = b.Cursor()
		}

		for k, v := c.First(); k != nil; k, v = c.Next() {
			if bytes.HasPrefix(k, []byte("__storm")) || len(v) == 0 {
				continue
			}

			var e T

			if err := db.Codec().Unmarshal(v, &e); err != nil {
				return err
			}

			entries = append(entries, e)
		}

		return nil
	})

	return entries, err
}

func countFromBucket(db *storm.DB, node string, bucket string) (int, error) {
	sum := 0

	err := db.Bolt.Update(func(tx *bbolt.Tx) error {
		var c *bbolt.Cursor

		if len(node) > 0 {
			outerBucket := db.From(node).GetBucket(tx)
			if outerBucket == nil {
				return nil
			}

			b, err := outerBucket.CreateBucketIfNotExists([]byte(bucket))
			if err != nil {
				return err
			}
			c = b.Cursor()
		} else {
			b, err := tx.CreateBucketIfNotExists([]byte(bucket))
			if err != nil {
				return err
			}
			c = b.Cursor()
		}

		for k, v := c.First(); k != nil; k, v = c.Next() {
			if bytes.HasPrefix(k, []byte("__storm")) || len(v) == 0 {
				continue
			}

			sum++
		}

		return nil
	})

	return sum, err
}

func fetchKeysFromBucket(db *storm.DB, node string, bucket string) ([]string, error) {
	var keys []string

	err := db.Bolt.Update(func(tx *bbolt.Tx) error {
		var c *bbolt.Cursor

		if len(node) > 0 {
			b, err := db.From(node).GetBucket(tx).CreateBucketIfNotExists([]byte(bucket))
			if err != nil {
				return err
			}
			c = b.Cursor()
		} else {
			b, err := tx.CreateBucketIfNotExists([]byte(bucket))
			if err != nil {
				return err
			}
			c = b.Cursor()
		}

		for k, v := c.First(); k != nil; k, v = c.Next() {
			if bytes.HasPrefix(k, []byte("__storm")) || len(v) == 0 {
				continue
			}

			keys = append(keys, string(k))
		}

		return nil
	})

	return keys, err
}
