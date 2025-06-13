#!/usr/bin/env ruby -w
# frozen_string_literal: true
# encoding: UTF-8
#
# = ProjectBroker_spec.rb -- The TaskJuggler III Project Management Software
#
# Copyright (c) 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014
#               by Chris Schlaeger <cs@taskjuggler.org>
#
# This program is free software; you can redistribute it and/or modify
# it under the terms of version 2 of the GNU General Public License as
# published by the Free Software Foundation.
#

require 'taskjuggler/daemon/ProjectBroker'

require 'support/spec_helper'

RSpec.configure do |config|
  config.expect_with(:rspec) { |c| c.syntax = :expect }
end

class TaskJuggler

  def TaskJuggler::runBroker(pb, key)
    pb.authKey = key
    pb.daemonize = false
    pb.logStdIO = false
    pb.port = 0
    # Don't generate any debug or info messages
    mh = MessageHandlerInstance.instance
    mh.outputLevel = 1
    mh.logLevel = 1
    t = Thread.new { pb.start }
    yield
    pb.stop
    t.join
  end

  describe ProjectBroker, :ruby => 1.9  do

    it "can be started and stopped" do
      @pb = ProjectBroker.new
      @authKey = 'secret'
      TaskJuggler::runBroker(@pb, @authKey) do
        true
      end
    end

  end

  describe ProjectBrokerIface, :ruby => 1.9 do

    before do
      @pb = ProjectBroker.new
      @pbi = ProjectBrokerIface.new(@pb)
      @authKey = 'secret'
    end

    describe "apiVersion" do

      it "should fail with bad authentication key" do
        TaskJuggler::runBroker(@pb, @authKey) do
          expect(@pbi.apiVersion('bad key', 1)).to eq(0)
        end
      end

      it "should pass with correct authentication key" do
        TaskJuggler::runBroker(@pb, @authKey) do
          expect(@pbi.apiVersion(@authKey, 1)).to eq(1)
        end
      end

      it "should fail with wrong API version", :ruby => 1.9 do
        TaskJuggler::runBroker(@pb, @authKey) do
          expect(@pbi.apiVersion(@authKey, 0)).to eq(-1)
        end
      end

    end

    describe "command" do

      it "should fail with bad authentication key" do
        TaskJuggler::runBroker(@pb, @authKey) do
          expect(@pbi.command('bad key', :status, [])).to be false
        end
      end

      it "should support 'status'" do
        TaskJuggler::runBroker(@pb, @authKey) do
          expect(@pbi.command(@authKey, :status, [])).to match \
            /.*No projects registered.*/
        end
      end

      it "should support 'terminate'" do
        TaskJuggler::runBroker(@pb, @authKey) do
          expect(@pbi.command(@authKey, :stop, [])).to be_nil
        end
      end

      it "should support 'add' and 'remove'" do
        TaskJuggler::runBroker(@pb, @authKey) do
          stdIn = StringIO.new("project foo 'foo' 2011-01-04 +1w task 'foo'")
          stdOut = StringIO.new
          stdErr = StringIO.new
          args = [ Dir.getwd, [ '.' ], stdOut, stdErr, stdIn, true ]
          expect(@pbi.command(@authKey, :addProject, args)).to be true
          expect(stdErr.string).to be_empty

          # Can't remove non-existing project bar
          expect(@pbi.command(@authKey, :removeProject, 'bar')).to be false
          expect(@pbi.command(@authKey, :removeProject, 'foo')).to be true
          # Can't remove foo twice
          expect(@pbi.command(@authKey, :removeProject, 'foo')).to be false
        end
      end

    end

    describe "updateState" do

      it "should fail with bad authentication key" do
        TaskJuggler::runBroker(@pb, @authKey) do
          expect(@pbi.updateState('bad key', 'foo', 'foo', :status, true)).to \
            be false
        end
      end

    end

  end

end
