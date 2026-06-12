package main

import (
	"context"
	"flag"
	"io"
	"log"
	"net"
	"net/http"

	"github.com/coder/websocket"
)

func main() {
	listen := flag.String("listen", ":2222", "TCP address exposed to SSH clients")
	upstream := flag.String("upstream", "", "wss:// URL of the Tuiport /bridge endpoint")
	token := flag.String("token", "", "relay token configured on the Worker")
	flag.Parse()
	if *upstream == "" || *token == "" {
		log.Fatal("-upstream and -token are required")
	}

	listener, err := net.Listen("tcp", *listen)
	if err != nil {
		log.Fatal(err)
	}
	log.Printf("forwarding %s to %s", *listen, *upstream)
	for {
		client, err := listener.Accept()
		if err != nil {
			log.Print(err)
			continue
		}
		go bridge(client, *upstream, *token)
	}
}

func bridge(client net.Conn, upstream, token string) {
	defer client.Close()
	headers := http.Header{"Authorization": {"Bearer " + token}}
	ws, _, err := websocket.Dial(context.Background(), upstream, &websocket.DialOptions{HTTPHeader: headers})
	if err != nil {
		log.Printf("dial upstream: %v", err)
		return
	}
	defer ws.CloseNow()
	socket := websocket.NetConn(context.Background(), ws, websocket.MessageBinary)
	defer socket.Close()
	done := make(chan struct{}, 2)
	go func() { _, _ = io.Copy(socket, client); done <- struct{}{} }()
	go func() { _, _ = io.Copy(client, socket); done <- struct{}{} }()
	<-done
}
