package main

import (
	"flag"
	"fmt"
	"io/ioutil"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"time"

	"github.com/otiai10/copy"
	"github.com/pierrre/archivefile/zip"
)

var BaseDir = os.Getenv("SND_DIR")
var Go = "go"

type Build struct {
	Package         string
	Arch            string
	OS              string
	Tags            string
	AdditionalFiles []string
}

var Builds = []Build{
	{
		Package:         "/cmd",
		Arch:            "amd64",
		OS:              "windows",
		Tags:            "ELECTRON LIBUSB",
		AdditionalFiles: []string{os.Getenv("SND_LIBUSB_DLL")},
	},
	{
		Package: "/cmd",
		Arch:    "amd64",
		OS:      "linux",
	},
	{
		Package: "/cmd",
		Arch:    "amd64",
		OS:      "darwin",
	},
	{
		Package: "/cmd",
		Arch:    "386",
		OS:      "darwin",
	},
	{
		Package: "/cmd",
		Arch:    "arm64",
		OS:      "darwin",
	},
}

func failOnErr(err error) {
	if err != nil {
		panic(err)
	}
}

func main() {
	skipBuilds := flag.Bool("skip-builds", false, "only bundle frontend")
	only := flag.String("only", "", "only build certain platforms")
	flag.Parse()

	if len(BaseDir) == 0 {
		panic("S&D directory not defined!")
	}

	if len(os.Getenv("SND_GO")) > 0 {
		Go = os.Getenv("SND_GO")
	}

	// Read go version

	goVersionCmd := exec.Command(Go, "version")
	goVersionCmd.Dir = BaseDir
	goVersion, err := goVersionCmd.CombinedOutput()

	// Read git information

	gitCommitCmd := exec.Command("git", "rev-list", "-1", "HEAD")
	gitCommitCmd.Dir = BaseDir
	gitCommit, err := gitCommitCmd.CombinedOutput()
	failOnErr(err)

	gitBranchCmd := exec.Command("git", "rev-parse", "--abbrev-ref", "HEAD")
	gitBranchCmd.Dir = BaseDir
	gitBranch, err := gitBranchCmd.CombinedOutput()
	failOnErr(err)

	fmt.Println("Go Version :", strings.Trim(string(goVersion), " \n\t"))
	fmt.Println("Commit     :", strings.Trim(string(gitCommit), " \n\t"))
	fmt.Println("Branch     :", strings.Trim(string(gitBranch), " \n\t"))

	// Remove old data

	fmt.Println("Clearing old data...")
	failOnErr(os.RemoveAll(filepath.Join(BaseDir, "/frontend/dist")))
	failOnErr(os.RemoveAll(filepath.Join(BaseDir, "/frontend/.cache")))
	failOnErr(os.RemoveAll("./release"))
	failOnErr(os.RemoveAll("./cache"))

	// Rebuild frontend

	fmt.Println("Vite Out: ===============")
	cmd := exec.Command("npm", "run", "build")
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	cmd.Dir = filepath.Join(BaseDir, "/frontend/")
	err = cmd.Run()

	failOnErr(err)

	// Copy over

	_ = os.MkdirAll("./cache", 0777)
	_ = os.MkdirAll("./frontend/dist", 0777)
	_ = os.MkdirAll("./release/", 0777)

	failOnErr(copy.Copy(filepath.Join(BaseDir, "/frontend/dist"), "./cache/frontend/dist"))

	ldflags := fmt.Sprintf("-X github.com/BigJk/snd.GitCommitHash=%s -X github.com/BigJk/snd.GitBranch=%s -X github.com/BigJk/snd.BuildTime=%s", strings.Trim(string(gitCommit), " \n\t"), strings.Trim(string(gitBranch), " \n\t"), time.Now().Format(time.RFC3339))
	if !*skipBuilds {
		for _, b := range Builds {
			if len(*only) > 0 && !strings.Contains(b.Arch+b.OS, *only) {
				fmt.Printf("=========================== [%s-%s]\n", b.OS, b.Arch)
				fmt.Println("Skipping...")
				fmt.Println("===========================")
				continue
			}

			target := fmt.Sprintf("./release/%s-%s [%s] [%02d.%02d.%04d]", b.OS, b.Arch, string(gitCommit)[0:8], time.Now().Month(), time.Now().Day(), time.Now().Year())

			ext := ""
			if b.OS == "windows" {
				ext = ".exe"
			}

			_ = os.MkdirAll(target, 0777)
			_ = os.MkdirAll(filepath.Join(target, "/data"), 0777)

			_ = copy.Copy(fmt.Sprintf("./res/%s-%s", b.OS, b.Arch), target)
			_ = copy.Copy("./cache/frontend/", filepath.Join(target, "/frontend"))
			_ = copy.Copy("./data/icon.png", filepath.Join(target, "/data/icon.png"))

			fmt.Printf("=========================== [%s-%s]\n", b.OS, b.Arch)
			cmd := exec.Command(Go, "build", "-ldflags", ldflags, "-o", "Sales & Dungeons"+ext, "-tags", b.Tags)
			cmd.Dir = filepath.Join(BaseDir, b.Package)
			buildOutput, err := cmd.CombinedOutput()
			fmt.Println("Output:", strings.Trim(string(buildOutput), " \n\t"))
			failOnErr(err)

			fmt.Println("Copy executable...")
			data, err := ioutil.ReadFile(filepath.Join(cmd.Dir, "/Sales & Dungeons"+ext))
			failOnErr(err)
			failOnErr(ioutil.WriteFile(filepath.Join(target, "/Sales & Dungeons"+ext), data, 0666))

			if len(b.AdditionalFiles) > 0 {
				for i := range b.AdditionalFiles {
					failOnErr(copy.Copy(b.AdditionalFiles[i], filepath.Join(target, filepath.Base(b.AdditionalFiles[i]))))
				}
			}

			_ = os.Remove(filepath.Join(cmd.Dir, "/Sales & Dungeons"+ext))

			fmt.Println("Start compressing...")
			file, err := os.Create(target + ".zip")
			failOnErr(err)
			failOnErr(zip.Archive(target, file, nil))
			failOnErr(file.Close())

			fmt.Println("===========================")
		}
	}

	targetFrontend := fmt.Sprintf("./release/%s [%s] [%02d.%02d.%04d]", "frontend", string(gitCommit)[0:8], time.Now().Month(), time.Now().Day(), time.Now().Year())
	file, err := os.Create(targetFrontend + ".zip")
	failOnErr(err)
	failOnErr(zip.Archive("./cache/frontend", file, nil))
	failOnErr(file.Close())

	_ = os.RemoveAll("./cache")
}
